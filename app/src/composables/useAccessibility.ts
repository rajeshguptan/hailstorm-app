import { onMounted, onUnmounted } from 'vue';

export function useFocusTrap(elementRef: { value: HTMLElement | null }) {
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !elementRef.value) return;
    
    const focusable = elementRef.value.querySelectorAll<HTMLElement>(focusableElements);
    if (focusable.length === 0) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });
}

export function useAnnouncer() {
  function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  }
  
  return { announce };
}