<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from './supabase';

  let loading = false;
  let email = '';
  let sent = false;
  let errorMessage = '';

  onMount(() => {
    // Check for errors in URL (e.g. from magic link redirect failure)
    const params = new URLSearchParams(window.location.hash.substring(1)); // Supabase uses hash for implicit
    const errorDesc = params.get('error_description');
    if (errorDesc) {
      errorMessage = decodeURIComponent(errorDesc).replace(/\+/g, ' ');
    }
  });

  async function handleLogin() {
    if (!email) return;
    try {
      loading = true;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      sent = true;
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
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

    {#if sent}
      <div class="sent-message">
        <div class="icon-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8L10.89 13.26C11.2187 13.4791 11.6094 13.5966 12.0039 13.5966C12.3984 13.5966 12.7891 13.4791 13.1179 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>Check your email</h3>
        <p>We sent a login link to <strong>{email}</strong></p>
        <button class="btn-link" on:click={() => sent = false}>Try different email</button>
      </div>
    {:else}
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
        <button type="submit" class="btn btn-primary full-width" disabled={loading}>
          {loading ? 'Sending Magic Link...' : 'Sign In with Email'}
        </button>
      </form>
    {/if}
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

  .sent-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }

  .icon-circle {
    width: 48px;
    height: 48px;
    background: rgba(99, 102, 241, 0.1);
    color: var(--color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-sm);
  }

  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    margin-top: var(--space-sm);
  }
</style>
