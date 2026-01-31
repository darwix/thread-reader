<script lang="ts">
  import { supabase } from './supabase';

  let loading = false;
  let email = '';
  let password = '';
  let errorMessage = '';

  async function handleLogin() {
    if (!email || !password) return;
    try {
      loading = true;
      errorMessage = '';
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page">
  <div class="login-card">
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L21 21M3 21L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
      </svg>
      <h1 class="gradient-text">ThreadReader</h1>
    </div>
    
    <p class="subtitle">Your personal Twitter thread library</p>

    {#if errorMessage}
      <div class="error-banner">
        {errorMessage}
      </div>
    {/if}

    <form class="login-form" on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email address</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          bind:value={email}
          required
          class="email-input"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          bind:value={password}
          required
          class="email-input"
        />
      </div>
      <button type="submit" class="btn btn-primary full-width" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
</div>

<style>
  .login-page {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
  }

  .login-card {
    background: var(--color-bg-secondary);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    width: 100%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--color-primary);
  }

  .subtitle {
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xl);
  }

  .error-banner {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-lg);
    font-size: 0.9rem;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    text-align: left;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .form-group label {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .email-input {
    width: 100%;
    padding: var(--space-sm);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
  }

  .email-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .full-width {
    width: 100%;
    justify-content: center;
  }
</style>
