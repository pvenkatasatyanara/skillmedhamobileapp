import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system';

import api from '../api/client';
import { createSocket } from '../api/socket';
import { getAgora, isAgoraAvailable } from './agora';

const FRAME_INTERVAL_MS = 5000;

/**
 * Live proctoring for the test screen.
 *
 * - In a custom dev/EAS build (react-native-agora present): publishes the
 *   student's camera + mic to an Agora channel so a human proctor can watch
 *   live, and sends periodic frames to AWS Rekognition via /agora/process-frame.
 * - In Expo Go (no native Agora): gracefully falls back to "frame" mode, using
 *   the caller-provided `captureFrame()` (expo-camera) to send periodic frames
 *   to the same AWS analysis endpoint, plus real-time socket violation/proctor
 *   events. No live human video in this mode.
 */
export default function useLiveProctoring({
  enabled,
  testId,
  token,
  studentId,
  companyOrg,
  captureFrame, // async () => base64 string (Expo Go fallback)
  onViolation,
  onProctorMessage,
}) {
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|error|off
  const [mode, setMode] = useState('off'); // agora|frame|off
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);

  const socketRef = useRef(null);
  const engineRef = useRef(null);
  const sessionRef = useRef(null);
  const intervalRef = useRef(null);
  const startedRef = useRef(false);

  const agoraAvailable = isAgoraAvailable();

  // ----- frame capture (Agora snapshot or expo-camera fallback) -----
  const grabFrame = useCallback(async () => {
    try {
      if (mode === 'agora' && engineRef.current) {
        const path = `${FileSystem.cacheDirectory}proctor-frame.jpg`;
        engineRef.current.takeSnapshot(0, path);
        await new Promise((r) => setTimeout(r, 350));
        const b64 = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
        return b64;
      }
      if (captureFrame) return await captureFrame();
    } catch (_) {}
    return null;
  }, [mode, captureFrame]);

  const sendFrame = useCallback(async () => {
    const sessionId = sessionRef.current?.sessionId;
    if (!sessionId) return;
    const frameBuffer = await grabFrame();
    if (!frameBuffer) return;
    try {
      await api.processFrame(token, { sessionId, frameBuffer, timestamp: Date.now() });
    } catch (_) {}
  }, [grabFrame, token]);

  // ----- socket listeners -----
  useEffect(() => {
    if (!enabled) return undefined;
    const socket = createSocket(token, { studentId });
    socketRef.current = socket;

    const onViol = (data) => onViolation && onViolation(data);
    const onMsg = (data) => {
      const m = {
        id: Date.now(),
        message: data?.message || data,
        timestamp: new Date(data?.timestamp || Date.now()),
        from: data?.from,
      };
      setMessages((prev) => [m, ...prev.slice(0, 9)]);
      setLatestMessage(m);
      onProctorMessage && onProctorMessage(data);
    };
    const onRequestFrame = async (data) => {
      const frameBuffer = await grabFrame();
      socket.emit('frameData', {
        sessionId: data?.sessionId || sessionRef.current?.sessionId,
        requestId: data?.requestId,
        frameBuffer,
        timestamp: data?.timestamp || Date.now(),
      });
    };

    socket.on('violationNotification', onViol);
    socket.on('proctorMessage', onMsg);
    socket.on('requestFrameCapture', onRequestFrame);

    return () => {
      socket.off('violationNotification', onViol);
      socket.off('proctorMessage', onMsg);
      socket.off('requestFrameCapture', onRequestFrame);
      try {
        socket.disconnect();
      } catch (_) {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token, studentId]);

  // ----- Agora engine -----
  const initAgora = useCallback((joinData) => {
    const A = getAgora();
    if (!A) return false;
    try {
      const createEngine = A.createAgoraRtcEngine || (A.default && A.default.createAgoraRtcEngine);
      const engine = createEngine();
      engine.initialize({ appId: joinData.appId });
      engine.enableVideo();
      engine.startPreview();
      engine.joinChannel(joinData.token, joinData.channelName, joinData.uid ?? 0, {
        clientRoleType: A.ClientRoleType ? A.ClientRoleType.ClientRoleBroadcaster : 1,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
      engineRef.current = engine;
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    if (!enabled || startedRef.current) return;
    if (!testId || !companyOrg) return; // live proctoring requires a company org
    startedRef.current = true;
    setStatus('connecting');
    try {
      const session = await api.createExamSession(token, testId, { companyOrg });
      if (session?.success === false) throw new Error(session?.message || 'Session failed');
      sessionRef.current = session;

      const join = await api.joinAgoraSession(token, {
        sessionId: session.sessionId,
        userType: 'student',
        companyOrg,
      });
      if (join?.success === false) throw new Error(join?.error || 'Join failed');

      let usedAgora = false;
      if (agoraAvailable) usedAgora = initAgora(join);
      setMode(usedAgora ? 'agora' : 'frame');

      socketRef.current?.emit('joinProctoringSession', {
        sessionId: session.sessionId,
        userType: 'student',
      });

      intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
      setStatus('connected');
    } catch (e) {
      setStatus('error');
      // Fall back to plain frame mode with a local (no server session) - still
      // useful: the caller keeps taking snapshots for the submission record.
      setMode(agoraAvailable ? 'error' : 'frame');
    }
  }, [enabled, testId, companyOrg, token, agoraAvailable, initAgora, sendFrame]);

  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      socketRef.current?.emit('leaveProctoringSession', {
        sessionId: sessionRef.current?.sessionId,
        userType: 'student',
      });
    } catch (_) {}
    try {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    } catch (_) {}
    startedRef.current = false;
    setStatus('off');
    setMode('off');
  }, []);

  useEffect(() => () => stop(), [stop]);

  // Local video component for Agora mode (null in Expo Go frame mode).
  const LocalVideo = useCallback(
    (props) => {
      const A = getAgora();
      const RtcSurfaceView = A && (A.RtcSurfaceView || (A.default && A.default.RtcSurfaceView));
      if (mode !== 'agora' || !RtcSurfaceView) return null;
      return <RtcSurfaceView canvas={{ uid: 0 }} {...props} />;
    },
    [mode]
  );

  return { status, mode, agoraAvailable, messages, latestMessage, start, stop, LocalVideo };
}