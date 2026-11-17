import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import forgotPasswordService from "../../../services/client/forgotPasswordService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldCls = "mb-5 flex flex-col gap-2";
const labelCls = "text-[13px] font-semibold text-ink";
const inputCls = "h-[45px] rounded-lg bg-[#f9f9f9] pl-10";
const errorCls = "mt-1 text-xs text-danger";
const backLinkCls =
  "mt-4 flex cursor-pointer items-center justify-center gap-2 bg-transparent text-xl text-[#888] transition-colors hover:text-[#333]";

function ClientForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(() => {
    const saved = localStorage.getItem('otp_lockoutTime');
    return saved ? parseInt(saved) : null;
  });
  const [lockedEmail, setLockedEmail] = useState(() => {
    const saved = localStorage.getItem('otp_lockedEmail');
    return saved ? saved : null;
  });
  const MAX_OTP_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30 * 60 * 1000;

  useEffect(() => {
    if (lockoutTime !== null) {
      localStorage.setItem('otp_lockoutTime', lockoutTime.toString());
    } else {
      localStorage.removeItem('otp_lockoutTime');
    }
  }, [lockoutTime]);

  useEffect(() => {
    if (lockedEmail !== null) {
      localStorage.setItem('otp_lockedEmail', lockedEmail);
    } else {
      localStorage.removeItem('otp_lockedEmail');
    }
  }, [lockedEmail]);

  useEffect(() => {
    if (lockoutTime !== null) {
      const now = Date.now();
      const timeRemaining = lockoutTime + LOCKOUT_DURATION - now;

      if (timeRemaining <= 0) {
        setLockoutTime(null);
        setLockedEmail(null);
        setOtpAttempts(0);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeRemaining = lockoutTime + LOCKOUT_DURATION - now;

        if (timeRemaining <= 0) {
          setLockoutTime(null);
          setLockedEmail(null);
          setOtpAttempts(0);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);


  const handleRequestForgotPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Vui lòng nhập email" });
      return;
    }

    if (lockedEmail === email && lockoutTime !== null) {
      const timeRemaining = lockoutTime + LOCKOUT_DURATION - Date.now();
      const minutesRemaining = Math.ceil(timeRemaining / 1000 / 60);
      toast.error(`Email này bị khóa. Vui lòng thử lại sau ${minutesRemaining} phút`);
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordService.requestForgotPassword(email);
      if (res.success) {
        toast.success("Mã OTP đã được gửi đến email của bạn!");
        setStep(2);
        setOtpAttempts(0);
        if (lockedEmail !== email) {
          setLockoutTime(null);
        }
        setResendCountdown(60);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      const res = await forgotPasswordService.requestForgotPassword(email);
      if (res.success) {
        toast.success("Mã OTP mới đã được gửi đến email của bạn!");
        setOtp("");
        setErrors({});
        setOtpAttempts(0);
        setResendCountdown(60);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };


  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!otp) {
      setErrors({ otp: "Vui lòng nhập mã OTP" });
      return;
    }

    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      toast.error("Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 30 phút");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordService.verifyOTP(email, otp);
      if (res.success) {
        toast.success("Xác nhận OTP thành công!");
        setOtpAttempts(0);
        setLockoutTime(null);
        setLockedEmail(null);
        setStep(3);
      }
    } catch (error) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        setLockoutTime(Date.now());
        setLockedEmail(email);
        toast.error("Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 30 phút");
      } else {
        const message =
          error.response?.data?.message || "Mã OTP không chính xác";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    let newErrors = {};

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu mới";
    } else if (password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordService.resetPassword(
        email,
        password,
        confirmPassword
      );
      if (res.success) {
        toast.success("Đặt lại mật khẩu thành công!");
        navigate("/");
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    } else {
      navigate("/");
    }
  };


  return (
    <>

          {step === 1 && (
            <form
              className="flex w-full flex-col"
              onSubmit={handleRequestForgotPassword}
              noValidate
            >
              <div className="mb-8">
                <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-ink max-md:text-[22px]">
                  Quên mật khẩu?
                </h1>
                <p className="text-sm leading-[1.5] text-subtle">
                  Vui lòng nhập email để nhận mã xác nhận
                </p>
              </div>

              <div className={fieldCls}>
                <Label htmlFor="email" className={labelCls}>
                  Email
                </Label>
                <div className="relative flex items-center">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 text-subtle"
                  />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    className={inputCls}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <span className={errorCls}>{errors.email}</span>
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-[45px] w-full bg-[linear-gradient(135deg,#0087f1_0%,#0058b8_100%)] text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,135,241,0.3)] disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Tiếp tục"
                )}
              </Button>

              <button
                type="button"
                className={backLinkCls}
                onClick={() => navigate("/")}
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              className="flex w-full flex-col"
              onSubmit={handleVerifyOTP}
              noValidate
            >
              <div className="mb-8">
                <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-ink max-md:text-[22px]">
                  Xác nhận OTP
                </h1>
                <p className="text-sm leading-[1.5] text-subtle">
                  Nhập mã OTP được gửi đến {email}
                </p>
              </div>

              <div className={fieldCls}>
                <Label htmlFor="otp" className={labelCls}>
                  Mã OTP
                </Label>

                <Input
                  id="otp"
                  type="text"
                  name="otp"
                  className="h-[45px] rounded-lg bg-[#f9f9f9]"
                  placeholder="Nhập 6 chữ số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength="6"
                  disabled={lockoutTime !== null}
                  aria-invalid={!!errors.otp}
                />
                {errors.otp && (
                  <span className={errorCls}>{errors.otp}</span>
                )}
                {lockoutTime !== null && (
                  <span className={errorCls}>
                    Bạn đã nhập sai quá 5 lần. Vui lòng đợi để thử lại
                  </span>
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-[45px] w-full bg-[linear-gradient(135deg,#0087f1_0%,#0058b8_100%)] text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,135,241,0.3)] disabled:opacity-70"
                disabled={loading || lockoutTime !== null}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Xác nhận"
                )}
              </Button>

              <button
                type="button"
                className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#e0e0e0] bg-[#f0f0f0] text-[13px] font-semibold text-[#0087f1] transition-all hover:-translate-y-px hover:border-[#0087f1] hover:bg-[#e8f4ff] disabled:pointer-events-none disabled:opacity-60"
                onClick={handleResendOTP}
                disabled={resendCountdown > 0 || lockoutTime !== null}
              >
                {resendCountdown > 0 && lockoutTime === null
                  ? `Gửi lại mã (${resendCountdown}s)`
                  : "Gửi lại mã OTP"}
              </button>

              <button
                type="button"
                className={backLinkCls}
                onClick={goBack}
              >
                ← Quay lại
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              className="flex w-full flex-col"
              onSubmit={handleResetPassword}
              noValidate
            >
              <div className="mb-8">
                <h1 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-ink max-md:text-[22px]">
                  Đặt mật khẩu mới
                </h1>
                <p className="text-sm leading-[1.5] text-subtle">
                  Nhập mật khẩu mới của bạn
                </p>
              </div>

              <div className={fieldCls}>
                <Label htmlFor="password" className={labelCls}>
                  Mật khẩu mới
                </Label>
                <div className="relative flex items-center">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3 text-subtle"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={inputCls}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 flex cursor-pointer items-center justify-center p-1 text-subtle transition-colors hover:text-ink"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className={errorCls}>
                    {errors.password}
                  </span>
                )}
              </div>

              <div className={fieldCls}>
                <Label htmlFor="confirmPassword" className={labelCls}>
                  Xác nhận mật khẩu
                </Label>
                <div className="relative flex items-center">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3 text-subtle"
                  />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={inputCls}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 flex cursor-pointer items-center justify-center p-1 text-subtle transition-colors hover:text-ink"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={errorCls}>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-[45px] w-full bg-[linear-gradient(135deg,#0087f1_0%,#0058b8_100%)] text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,135,241,0.3)] disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Đặt mật khẩu mới"
                )}
              </Button>

              <button
                type="button"
                className={backLinkCls}
                onClick={goBack}
              >
                ← Quay lại
              </button>
            </form>
          )}
    </>
  );
}

export default ClientForgotPassword;
