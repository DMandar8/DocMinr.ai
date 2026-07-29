import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/api';
import { Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Update password strength
    if (name === 'password') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      });
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allValid = Object.values(passwordStrength).every(Boolean);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>Create Account</h1>
          <p>Start your DocMinr.ai journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                disabled={loading}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
            />
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthItem}>
                  {passwordStrength.length ? <Check size={14} /> : <X size={14} />}
                  <span>At least 8 characters</span>
                </div>
                <div className={styles.strengthItem}>
                  {passwordStrength.uppercase ? <Check size={14} /> : <X size={14} />}
                  <span>One uppercase letter</span>
                </div>
                <div className={styles.strengthItem}>
                  {passwordStrength.lowercase ? <Check size={14} /> : <X size={14} />}
                  <span>One lowercase letter</span>
                </div>
                <div className={styles.strengthItem}>
                  {passwordStrength.number ? <Check size={14} /> : <X size={14} />}
                  <span>One number</span>
                </div>
                <div className={styles.strengthItem}>
                  {passwordStrength.special ? <Check size={14} /> : <X size={14} />}
                  <span>One special character</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !allValid || formData.password !== formData.confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className={styles.authLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}