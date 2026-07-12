"use client";
import { useState, useEffect, useRef } from "react";
import { getMe, updateName, changePassword, changeEmail, setupMfa, verifyMfaSetup, disableMfa, uploadPhoto, exportMyData } from "@/lib/actions/settings";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";

interface Account {
  fullname: string;
  email: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  profilePhoto: string | null;
}

export default function MentorSettingsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [fullname, setFullname] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [mfaStep, setMfaStep] = useState<"idle" | "setup" | "verify">("idle");
  const [mfaData, setMfaData] = useState<{ qrCodeDataUrl?: string; secret?: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const [disableStep, setDisableStep] = useState(false);
  const [disablePw, setDisablePw] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getMe().then((res) => {
      if (res.success) {
        setAccount(res.data);
        setNewEmail(res.data.email);
        setFullname(res.data.fullname);
      } else toast.error(res.message);
      setLoading(false);
    });
  }, []);

  const handleSaveName = async () => {
  if (!fullname.trim()) return toast.error("Name cannot be empty");
  setSavingName(true);
  const res = await updateName(fullname.trim());
  if (res.success) {
    toast.success("Name updated");
    setAccount((prev) => (prev ? { ...prev, fullname: fullname.trim() } : prev));
    if (user) {
      const updated = { ...user, fullname: fullname.trim() };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    }
  } else toast.error(res.message);
  setSavingName(false);
};

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) return toast.error("Fill in both fields");
    setSavingEmail(true);
    const res = await changeEmail({ newEmail, currentPassword: emailPassword });
    if (res.success) {
      toast.success(res.message);
      setEmailPassword("");
    } else toast.error(res.message);
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!pw.currentPassword || !pw.password || !pw.confirmPassword) {
      return toast.error("Fill in all fields");
    }
    if (pw.password !== pw.confirmPassword) return toast.error("Passwords do not match");
    setSavingPw(true);
    const res = await changePassword(pw);
    if (res.success) {
      toast.success(res.message);
      setPw({ currentPassword: "", password: "", confirmPassword: "" });
    } else toast.error(res.message);
    setSavingPw(false);
  };

  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    const res = await setupMfa();
    if (res.success) {
      setMfaData(res.data);
      setMfaStep("verify");
    } else toast.error(res.message);
    setMfaLoading(false);
  };

  const handleVerifyMfa = async () => {
    if (mfaCode.length !== 6) return toast.error("Enter the 6-digit code");
    setMfaLoading(true);
    const res = await verifyMfaSetup(mfaCode);
    if (res.success) {
      toast.success("Two-factor authentication enabled");
      setAccount((prev) => (prev ? { ...prev, mfaEnabled: true } : prev));
      setMfaStep("idle");
      setMfaCode("");
      setMfaData(null);
    } else toast.error(res.message);
    setMfaLoading(false);
  };

  const handleDisableMfa = async () => {
    if (!disablePw || disableCode.length < 6) return toast.error("Fill in both fields");
    setDisabling(true);
    const res = await disableMfa({ currentPassword: disablePw, code: disableCode });
    if (res.success) {
      toast.success(res.message);
      setAccount((prev) => (prev ? { ...prev, mfaEnabled: false } : prev));
      setDisableStep(false);
      setDisablePw("");
      setDisableCode("");
    } else toast.error(res.message);
    setDisabling(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setPhotoPreview(URL.createObjectURL(file));
  setUploadingPhoto(true);
  const res = await uploadPhoto(file);
  if (res.success) {
    toast.success("Photo updated");
    setAccount((prev) => (prev ? { ...prev, profilePhoto: res.data.profilePhoto } : prev));
    if (user) {
      const updated = { ...user, profilePhoto: res.data.profilePhoto };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
    }
  } else {
    toast.error(res.message);
    setPhotoPreview(null);
  }
  setUploadingPhoto(false);
};

  const handleExportData = async () => {
    setExporting(true);
    const res = await exportMyData();
    if (res.success) toast.success("Your data has been downloaded");
    else toast.error(res.message);
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B5EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and security.</p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Profile photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl overflow-hidden flex-shrink-0">
            {photoPreview ? (
              <img src={photoPreview} className="w-full h-full object-cover" alt="preview" />
            ) : account?.profilePhoto ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/uploads/profile-photos/${account.profilePhoto}`}
                className="w-full h-full object-cover"
                alt="profile"
              />
            ) : (
              fullname?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 disabled:opacity-60 px-4 py-2 rounded-xl transition"
            >
              {uploadingPhoto ? "Uploading..." : "Change photo"}
            </button>
            <p className="text-xs text-slate-400 mt-1.5">JPG, PNG up to 2MB</p>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Account</h2>

        <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="flex-1 h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
          />
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="h-11 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition whitespace-nowrap"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition mb-2"
        />
        {!account?.emailVerified && (
          <p className="text-xs text-amber-600 mb-3">Your email is not verified.</p>
        )}
        <input
          type="password"
          value={emailPassword}
          onChange={(e) => setEmailPassword(e.target.value)}
          placeholder="Current password to confirm"
          className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition mb-3"
        />
        <button
          onClick={handleChangeEmail}
          disabled={savingEmail}
          className="h-9 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
        >
          {savingEmail ? "Saving..." : "Update email"}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Change password</h2>

        <div className="space-y-3">
          <input
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Current password"
            className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
          />
          <input
            type="password"
            value={pw.password}
            onChange={(e) => setPw((f) => ({ ...f, password: e.target.value }))}
            placeholder="New password"
            className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
          />
          <input
            type="password"
            value={pw.confirmPassword}
            onChange={(e) => setPw((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Confirm new password"
            className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPw}
          className="h-9 px-4 mt-3 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
        >
          {savingPw ? "Saving..." : "Update password"}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Two-factor authentication</h2>
        <p className="text-sm text-slate-500 mb-4">
          Add an extra layer of security using an authenticator app.
        </p>

        {account?.mfaEnabled ? (
          disableStep ? (
            <div className="space-y-3">
              <input
                type="password"
                value={disablePw}
                onChange={(e) => setDisablePw(e.target.value)}
                placeholder="Current password"
                className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              />
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.slice(0, 10))}
                placeholder="6-digit code or recovery code"
                className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDisableMfa}
                  disabled={disabling}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
                >
                  {disabling ? "Disabling..." : "Confirm disable"}
                </button>
                <button
                  onClick={() => setDisableStep(false)}
                  className="h-9 px-4 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="inline-block text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
                Enabled
              </span>
              <button
                onClick={() => setDisableStep(true)}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Disable
              </button>
            </div>
          )
        ) : mfaStep === "idle" ? (
          <button
            onClick={handleStartMfaSetup}
            disabled={mfaLoading}
            className="h-9 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {mfaLoading ? "Starting..." : "Enable 2FA"}
          </button>
        ) : (
          <div className="space-y-4">
            {mfaData?.qrCodeDataUrl ? (
              <img src={mfaData.qrCodeDataUrl} alt="MFA QR code" className="w-40 h-40 rounded-xl border border-slate-100" />
            ) : (
              <p className="text-sm text-slate-500">
                Enter this code manually in your authenticator app:
                <br />
                <span className="font-mono text-slate-900">{mfaData?.secret}</span>
              </p>
            )}
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EFF] focus:border-transparent transition"
            />
            <button
              onClick={handleVerifyMfa}
              disabled={mfaLoading}
              className="h-9 px-4 bg-[#3B5EFF] hover:bg-[#2f4de0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {mfaLoading ? "Verifying..." : "Verify & enable"}
            </button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Your data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Download a copy of your profile, bookings, and reviews.
        </p>
        <button
          onClick={handleExportData}
          disabled={exporting}
          className="h-9 px-4 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-medium rounded-lg transition"
        >
          {exporting ? "Preparing..." : "Download my data"}
        </button>
      </section>
    </div>
  );
}