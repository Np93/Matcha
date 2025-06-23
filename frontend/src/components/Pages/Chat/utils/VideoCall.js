import React, {
    useEffect,
    useRef,
    useState,
    useImperativeHandle,
    forwardRef,
  } from "react";
  import { showErrorToast } from "../../../../utils/showErrorToast";
  
  const VideoCall = forwardRef(({ userId, chatId, otherUserId }, ref) => {
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [error, setError] = useState(null);
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);
    const peerRef = useRef(null);
    const localStream = useRef(null);
    const iceQueue = useRef([]);
    const videoSocket = useRef(null);
    const lastChatIdRef = useRef(null);
    const hasEndedRef = useRef(false);
  
    const connectVideoSocket = () => {
        if (!chatId) {
          // console.warn("⛔ Impossible d'ouvrir la socket vidéo : utilisateur ou chatId invalide");
          return;
        }
        if (videoSocket.current && videoSocket.current.readyState <= 1) {
            // console.log("🔁 Socket déjà ouverte ou en cours");
            return;
          }
      
        // console.log("🔗 Connexion WebSocket vidéo sur chat", chatId);
        videoSocket.current = new WebSocket(
          `wss://${window.location.host}/chat/ws/video/${chatId}`
        );
      
        videoSocket.current.onopen = () => {
          // console.log("✅ WebSocket vidéo connectée");
        };
      
        videoSocket.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          handleSignalingData(data);
        };
      
        videoSocket.current.onclose = () => {
          // console.log("❌ WebSocket vidéo fermée");
        };
      
        videoSocket.current.onerror = (error) => {
          // console.error("Erreur WebSocket vidéo :", error);
        };
      };
  
    const startCall = () => {
      hasEndedRef.current = false;
      setInCall(false);
      setIncomingCall(false);
      setError(null);
      peerRef.current = null;
      localStream.current = null;
      videoSocket.current?.send(
        JSON.stringify({
          event: "call_request",
          from_user_id: userId,
          to_user_id: otherUserId,
        })
      );
    };
  
    const acceptCall = async () => {
      hasEndedRef.current = false;
      setIncomingCall(false);
      setInCall(true);
      try {
        await initWebRTC(true);
        videoSocket.current.send(
          JSON.stringify({
            event: "call_response",
            accepted: true,
            from_user_id: userId,
            to_user_id: otherUserId,
          })
        );
      } catch (err) {
        setError("Permission denied or device unavailable");
        endCall();
      }
    };
  
    const rejectCall = () => {
      setIncomingCall(false);
      videoSocket.current?.send(
        JSON.stringify({
          event: "call_response",
          accepted: false,
          from_user_id: userId,
          to_user_id: otherUserId,
        })
      );
    };
  
    const endCall = () => {
        if (hasEndedRef.current) return;
        hasEndedRef.current = true;
      
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
      
        if (localStream.current) {
          localStream.current.getTracks().forEach((track) => track.stop());
          localStream.current = null;
        }
      
        setInCall(false);
        setIncomingCall(false);
      
        if (videoSocket.current?.readyState === WebSocket.OPEN) {
          videoSocket.current.send(
            JSON.stringify({
              event: "call_cancel",
              from_user_id: userId,
              to_user_id: otherUserId,
            })
          );
        }
      };
  
    const initWebRTC = async (isReceiver = false) => {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        throw new Error("Permission denied or media not available");
      }
  
      if (localVideoRef.current)
        localVideoRef.current.srcObject = localStream.current;
  
      peerRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
  
      localStream.current.getTracks().forEach((track) =>
        peerRef.current.addTrack(track, localStream.current)
      );
  
      peerRef.current.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
  
      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          videoSocket.current.send(
            JSON.stringify({
              event: "ice-candidate",
              candidate: e.candidate,
              from_user_id: userId,
              to_user_id: otherUserId,
            })
          );
        }
      };
  
      if (iceQueue.current.length > 0) {
        for (const c of iceQueue.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(c));
        }
        iceQueue.current = [];
      }
  
      if (!isReceiver) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        videoSocket.current.send(
          JSON.stringify({
            event: "offer",
            offer,
            from_user_id: userId,
            to_user_id: otherUserId,
          })
        );
      }
    };
  
    const handleSignalingData = async (data) => {
      if (data.to_user_id !== userId) return;
  
      switch (data.event) {
        case "call_request":
          setIncomingCall(true);
          break;
        case "call_response":
          if (data.accepted) {
            setInCall(true);
            try {
              await initWebRTC();
            } catch (err) {
              setError("Unable to access camera");
              endCall();
            }
          } else {
            showErrorToast("The user rejected the call.");
            endCall();
          }
          break;
        case "call_cancel":
          if (!hasEndedRef.current) {
            // console.log("🔴 Call ended by peer");
            endCall(); // Ne renverra pas de call_cancel car hasEndedRef est déjà true après
          }
          break;
        case "offer":
          if (!peerRef.current) await initWebRTC(true);
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          videoSocket.current.send(
            JSON.stringify({
              event: "answer",
              answer,
              from_user_id: userId,
              to_user_id: data.from_user_id,
            })
          );
          break;
        case "answer":
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          }
          break;
        case "ice-candidate":
          if (!peerRef.current) {
            iceQueue.current.push(data.candidate);
          } else {
            await peerRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }
          break;
      }
    };
  
    useImperativeHandle(ref, () => ({ handleSignalingData }));
  
    useEffect(() => {
        if (error) {
          const timer = setTimeout(() => {
            setError(null);
          }, 5000); // 5 secondes
      
          return () => clearTimeout(timer);
        }
      }, [error]);

      useEffect(() => {
        if (!chatId || !otherUserId) return;
      
        const shouldNotClose =
          lastChatIdRef.current === null || lastChatIdRef.current === chatId;
      
        if (!shouldNotClose) {
          // On change de chat → fermer l’ancienne socket
          if (
            videoSocket.current &&
            (videoSocket.current.readyState === WebSocket.OPEN ||
              videoSocket.current.readyState === WebSocket.CONNECTING)
          ) {
            // console.log("🧹 Fermeture socket pour ancien chat", lastChatIdRef.current);
            videoSocket.current.close();
          }
          videoSocket.current = null;
        }
      
        if (!videoSocket.current || videoSocket.current.readyState > 1) {
          // console.log("🔗 Connexion WebSocket vidéo sur chat", chatId);
          connectVideoSocket();
        }
      
        lastChatIdRef.current = chatId;
      
        return () => {
          if (
            lastChatIdRef.current !== null &&
            lastChatIdRef.current !== chatId &&
            videoSocket.current &&
            (videoSocket.current.readyState === WebSocket.OPEN ||
              videoSocket.current.readyState === WebSocket.CONNECTING)
          ) {
            // console.log("🔌 Fermeture WebSocket vidéo pour chat", chatId);
            videoSocket.current.close();
            videoSocket.current = null;
          }
        };
      }, [chatId, otherUserId]);
  
    return (
      <>
        {error && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center p-2 z-50">
            {error}
          </div>
        )}
  
        {/* Écran d'appel entrant */}
        {incomingCall && !inCall && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            <p className="text-white text-xl mb-6">📲 Incoming call...</p>
            <div className="flex gap-4">
              <button
                onClick={acceptCall}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded text-lg"
              >
                Accept
              </button>
              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded text-lg"
              >
                Hang up
              </button>
            </div>
          </div>
        )}
  
        {/* Écran d'appel actif */}
        {inCall && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-24 h-24 sm:w-32 sm:h-32 rounded-lg shadow-lg border-2 border-white"
            />
            <button
              onClick={endCall}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full shadow-lg text-xl"
            >
              Hang up
            </button>
          </div>
        )}
  
        {/* Bouton de lancement d’appel */}
        <div className="mt-2 flex justify-end">
            {!inCall && !incomingCall && (
                <button
                onClick={startCall}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                📞 Call
                </button>
            )}
        </div>
      </>
    );
  });
  
  export default VideoCall;