<template>
  <div class="feedback-panel h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
    <div class="feedback-header px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <h5 class="mb-0 text-zinc-900 dark:text-white">Feedback</h5>
    </div>
    <div class="feedback-content flex-1 p-6 overflow-y-auto">
      <form @submit.prevent="submitFeedback" class="max-w-lg space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Feedback</label>
          <textarea
            v-model="form.feedback"
            required
            rows="4"
            class="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us what you think..."
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
          <select
            v-model="form.type"
            required
            class="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Bug">Bug Report</option>
            <option value="Feature">Feature Request</option>
            <option value="Question">Question</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email (optional)</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>
        <div class="flex gap-2 pt-2">
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Submitting...' : 'Submit Feedback' }}
          </button>
          <button
            v-if="submitted"
            type="button"
            @click="resetForm"
            class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Send More
          </button>
        </div>
        <div v-if="submitted" class="text-green-600 dark:text-green-400 text-sm">
          Thank you for your feedback!
        </div>
        <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const form = ref({
  feedback: '',
  type: 'Bug',
  email: ''
});

const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

async function submitFeedback() {
  if (!form.value.feedback.trim()) return;
  
  submitting.value = true;
  error.value = '';
  
  try {
    await window.api.submitFeedback({
      feedback: form.value.feedback,
      type: form.value.type,
      email: form.value.email
    });
    submitted.value = true;
    form.value.feedback = '';
    form.value.email = '';
  } catch (err: any) {
    error.value = err.message || 'Failed to submit feedback';
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  submitted.value = false;
  form.value = {
    feedback: '',
    type: 'Bug',
    email: ''
  };
}
</script>