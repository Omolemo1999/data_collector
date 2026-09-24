"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Container, LinearProgress,
  Stack, TextField, Typography
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";
import { useRouter } from "next/navigation";

type Prompt = {
  category: "fear" | "scream" | "not_fear" | "background";
  text: string;
};

const prompts: Prompt[] = [
  { category: "fear", text: "Act out a short frightened reaction using your voice only." },
  { category: "fear", text: "Act out a brief worried or frightened response to something unexpected." },
  { category: "fear", text: "Use your voice to portray a character who suddenly feels afraid." },
  { category: "scream", text: "Produce a short acted scream, using your voice only and staying comfortable." },
  { category: "scream", text: "Produce another short acted scream, without hurting yourself or straining your voice." },
  { category: "not_fear", text: "Say a short neutral sentence in your normal speaking voice." },
  { category: "not_fear", text: "Read this naturally: The weather is pleasant today." },
  { category: "not_fear", text: "Say a short sentence sounding calm and ordinary." },
  { category: "background", text: "Remain quiet and record the ordinary background sound around you." },
  { category: "background", text: "Remain quiet for a few seconds while your normal environment is recorded." }
];

function label(category: Prompt["category"]) {
  return category.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecordPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [payout, setPayout] = useState({accountHolderName:"",bankName:"",accountNumber:"",accountType:"cheque",branchCode:""});
  const [payoutOpen,setPayoutOpen]=useState(false); const [payoutSaved,setPayoutSaved]=useState(false); const [payoutSaving,setPayoutSaving]=useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const prompt = prompts[index];

  useEffect(() => {
    if (!sessionStorage.getItem("participantId")) router.replace("/consent");
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startRecording() {
    setError("");
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const recorded = new Blob(chunksRef.current, { type });
        setBlob(recorded);
        setPreviewUrl(URL.createObjectURL(recorded));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access was not granted. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  function retake() {
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  }

  async function submitRecording() {
    if (!blob) return;
    setSubmitting(true);
    setError("");

    try {
      const participantId = sessionStorage.getItem("participantId");
      if (!participantId) throw new Error("Participant session is missing.");

      const form = new FormData();
      const extension = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `${participantId}_${index + 1}.${extension}`);
      form.append("participantId", participantId);
      form.append("category", prompt.category);
      form.append("prompt", prompt.text);
      form.append("promptIndex", String(index));

      const response = await fetch("/api/recordings", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");

      if (index === prompts.length - 1) {
        setDone(true);
      } else {
        setIndex((current) => current + 1);
        setBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>Thank you!</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Your recordings have been submitted for researcher review. Every recording starts as pending.
            </Typography>
            <Alert severity="info" sx={{mb:3}}>Each approved recording earns 100 points. 100 points = R10, 200 = R20, 500 = R50, and 1,000 = R100. Approval does not automatically send money.</Alert>
            <Stack spacing={2}>
              <Button variant="outlined" onClick={()=>setPayoutOpen(v=>!v)}>{payoutSaved?"Update payout details":"Add payout details"}</Button>
              {payoutOpen && <Box sx={{textAlign:"left",p:2,borderRadius:2,bgcolor:"grey.100"}}>
                <Typography fontWeight={700} gutterBottom>Bank transfer details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb:2}}>Use bank-account details only. Never enter a card PIN, CVV/CVC, online-banking password, or OTP.</Typography>
                <Stack spacing={2}>
                  <TextField label="Account holder name" value={payout.accountHolderName} onChange={e=>setPayout({...payout,accountHolderName:e.target.value})}/>
                  <TextField label="Bank name" value={payout.bankName} onChange={e=>setPayout({...payout,bankName:e.target.value})}/>
                  <TextField label="Account number" inputMode="numeric" value={payout.accountNumber} onChange={e=>setPayout({...payout,accountNumber:e.target.value.replace(/\D/g,"")})}/>
                  <TextField label="Branch code" value={payout.branchCode} onChange={e=>setPayout({...payout,branchCode:e.target.value})}/>
                  <TextField select label="Account type" value={payout.accountType} onChange={e=>setPayout({...payout,accountType:e.target.value})}><MenuItem value="cheque">Cheque / Current</MenuItem><MenuItem value="savings">Savings</MenuItem><MenuItem value="other">Other</MenuItem></TextField>
                  <Button variant="contained" disabled={payoutSaving} onClick={async()=>{setPayoutSaving(true);const r=await fetch("/api/participant/payout-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({participantId:sessionStorage.getItem("participantId"),...payout})});setPayoutSaving(false);if(r.ok){setPayoutSaved(true);setPayoutOpen(false)}else{const d=await r.json();alert(d.error||"Could not save details.")}}}>{payoutSaving?"Saving...":"Save payout details"}</Button>
                </Stack>
              </Box>}
              <Button variant="contained" onClick={()=>router.push("/")}>Finish</Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={700}>RECORDING SESSION</Typography>
          <Typography variant="h4" fontWeight={800}>Clip {index + 1} of {prompts.length}</Typography>
          <LinearProgress variant="determinate" value={((index + 1) / prompts.length) * 100} sx={{ mt: 2 }} />
        </Box>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              <Chip label={label(prompt.category)} color="primary" sx={{ width: "fit-content" }} />
              <Typography variant="h5" fontWeight={700}>{prompt.text}</Typography>

              {error && <Alert severity="error">{error}</Alert>}

              {!blob && !recording && (
                <Button startIcon={<MicIcon />} variant="contained" size="large" onClick={startRecording}>
                  Start recording
                </Button>
              )}

              {recording && (
                <Button startIcon={<StopIcon />} variant="contained" color="error" size="large" onClick={stopRecording}>
                  Stop recording
                </Button>
              )}

              {previewUrl && (
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>Preview</Typography>
                  <audio controls src={previewUrl} style={{ width: "100%" }} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Button startIcon={<ReplayIcon />} variant="outlined" onClick={retake}>
                      Retake
                    </Button>
                    <Button
                      startIcon={<SendIcon />}
                      variant="contained"
                      onClick={submitRecording}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit clip"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}