import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      // Helpboard used token param containing whatever auth-service returns; try login flow
      // Our authAPI.login expects credentials; if external token flow is different, adapt as needed.
      // Here we'll store token and navigate to users.
      localStorage.setItem('access_token', token);
      navigate('/helpboard/users');
    } else {
      navigate('/');
    }
  }, [params, navigate, login]);

  return <p>Completing login…</p>;
}
