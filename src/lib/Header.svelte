<script lang="ts">
  import { supabase } from './supabase';


  async function handleSignOut() {
    await supabase.auth.signOut();
  }
</script>

<header class="header">
  <div class="header-content">
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L21 21M3 21L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
      </svg>
      <h1 class="gradient-text">ThreadReader</h1>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" on:click={handleSignOut}>
        Sign Out
      </button>
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    backdrop-filter: blur(12px);
  }

  .header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--color-primary);
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  @media (max-width: 768px) {
    .header-content {
      padding: var(--space-md) var(--space-lg);
    }

    h1 {
      font-size: 1.25rem;
    }


  }
</style>
