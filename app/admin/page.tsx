"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControl, InputLabel,
  MenuItem, Select, Stack, TextField, Typography
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

type RecordItem = {
  id: string;
  participantId: string;
  category: string;
  prompt: string;
  promptIndex: number;
  filename: string;
  relativePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  points: number;
  reviewNote?: string;
  reviewedAt?: string;
};

export default function AdminPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [payoutProfile, setPayoutProfile] = useState<any>(null);

  async function load() {
    const response = await fetch("/api/admin/records", { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not load records.");
      return;
    }
    setRecords(data.records);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === "all" ? records : records.filter((r) => r.status === filter),
    [records, filter]
  );

  async function review(status: "approved" | "rejected") {
    if (!selected) return;
    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, reviewNote: note })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Review failed.");
      setSaving(false);
      return;
    }

    setSelected(null);
    setNote("");
    await load();
    setSaving(false);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const counts = {
    pending: records.filter((r) => r.status === "pending").length,
    approved: records.filter((r) => r.status === "approved").length,
    rejected: records.filter((r) => r.status === "rejected").length
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700}>BACK OFFICE</Typography>
            <Typography variant="h4" fontWeight={800}>Recording Review</Typography>
            <Typography color="text.secondary">
              Listen to every submission and approve or reject it before it is used.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button startIcon={<DownloadIcon />} variant="outlined"
              href="/api/admin/export?status=approved">Export approved CSV</Button>
            <Button startIcon={<LogoutIcon />} variant="outlined" onClick={logout}>Logout</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`Pending: ${counts.pending}`} color="warning" />
          <Chip label={`Approved: ${counts.approved}`} color="success" />
          <Chip label={`Rejected: ${counts.rejected}`} />
          <Chip label={`Total: ${records.length}`} />
        </Stack>

        <FormControl sx={{ maxWidth: 240 }}>
          <InputLabel>Filter</InputLabel>
          <Select value={filter} label="Filter" onChange={(e) => setFilter(e.target.value)}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>

        <Stack spacing={2}>
          {filtered.map((record) => (
            <Card key={record.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography fontWeight={800}>{record.filename}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Participant: {record.participantId} · Category: {record.category} · {new Date(record.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={record.status}
                      color={record.status === "approved" ? "success" : record.status === "pending" ? "warning" : "default"}
                    />
                  </Stack>

                  <Typography>{record.prompt}</Typography>
                  <Typography variant="body2" fontWeight={700}>Points: {record.points || 0} · Value: R{((record.points || 0)*0.10).toFixed(2)}</Typography>

                  <audio controls src={`/api/admin/audio/${record.relativePath}`} style={{ width: "100%" }} />

                  <Stack direction="row" spacing={1}>
                    <Button startIcon={<CheckCircleIcon />} variant="contained" color="success"
                      onClick={() => { setSelected(record); setNote(record.reviewNote || ""); setPayoutProfile(null); fetch(`/api/admin/payout-profile?participantId=${encodeURIComponent(record.participantId)}`).then(r=>r.ok?r.json():null).then(d=>setPayoutProfile(d?.profile||null)); }}>
                      Review
                    </Button>
                    <Button startIcon={<CancelIcon />} variant="outlined"
                      onClick={() => { setSelected(record); setNote(record.reviewNote || ""); setPayoutProfile(null); fetch(`/api/admin/payout-profile?participantId=${encodeURIComponent(record.participantId)}`).then(r=>r.ok?r.json():null).then(d=>setPayoutProfile(d?.profile||null)); }}>
                      Review / Reject
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Alert severity="info">No recordings match this filter.</Alert>
          )}
        </Stack>
      </Stack>

      <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>Review recording</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selected.filename} · {selected.category}
              </Typography>
              <audio controls src={`/api/admin/audio/${selected.relativePath}`} style={{ width: "100%" }} />
              {payoutProfile && <Box sx={{p:2,bgcolor:"grey.100",borderRadius:2}}>
                <Typography fontWeight={700}>Payout details</Typography>
                <Typography variant="body2">Account holder: {payoutProfile.accountHolderName}</Typography>
                <Typography variant="body2">Bank: {payoutProfile.bankName}</Typography>
                <Typography variant="body2">Account: {payoutProfile.accountNumber}</Typography>
                <Typography variant="body2">Type: {payoutProfile.accountType} · Branch: {payoutProfile.branchCode}</Typography>
              </Box>}
              <TextField
                label="Review note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                placeholder="Optional reason or quality note"
              />
              <Typography variant="caption" color="text.secondary">
                Approval does not trigger payment. It only marks this recording as approved for dataset use.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)} disabled={saving}>Cancel</Button>
          <Button onClick={() => review("rejected")} disabled={saving} color="error">Reject</Button>
          <Button onClick={() => review("approved")} disabled={saving} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}