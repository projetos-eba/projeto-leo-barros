import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LoginView,
  type LoginCredentials,
} from "@/components/auth/login-view";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async ({ loginId, password }: LoginCredentials) => {
    setIsLoading(true);

    try {
      let authEmail = loginId.trim();
      const digits = loginId.replace(/\D/g, "");
      if (digits.length === 11 && !loginId.includes("@")) {
        const { data: patient } = await supabase
          .from("patients")
          .select("email, cpf")
          .eq("cpf", digits)
          .single();

        if (patient?.email) {
          authEmail = patient.email;
        } else {
          authEmail = `${digits}@patient.local`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (error) throw error;

      const role = data.user?.user_metadata?.role;
      if (role === "patient") {
        navigate("/patient");
      } else {
        navigate("/admin");
      }

      toast.success("Login realizado com sucesso!");
    } catch {
      toast.error("Erro ao fazer login", { description: "CPF/email ou senha incorretos" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginView
      loginId={loginId}
      password={password}
      isLoading={isLoading}
      onLoginIdChange={setLoginId}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
    />
  );
};

export default Login;
