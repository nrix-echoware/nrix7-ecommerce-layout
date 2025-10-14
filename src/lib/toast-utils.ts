import { toast } from 'sonner';

interface ToastLinkOptions {
  href: string;
  text: string;
  className?: string;
  target?: '_blank' | '_self';
}

/**
 * Creates a success toast with a link
 */
export function toastSuccessWithLink(
  title: string,
  description?: string,
  link?: ToastLinkOptions,
  action?: { label: string; onClick: () => void }
) {
  const message = description ? `${title}\n${description}` : title;
  
  return toast.success(message, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    description: link ? `Click here: ${link.href}` : undefined,
  });
}

/**
 * Creates an info toast with a link
 */
export function toastInfoWithLink(
  title: string,
  description?: string,
  link?: ToastLinkOptions,
  action?: { label: string; onClick: () => void }
) {
  const message = description ? `${title}\n${description}` : title;
  
  return toast.info(message, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    description: link ? `Click here: ${link.href}` : undefined,
  });
}

/**
 * Creates a warning toast with a link
 */
export function toastWarningWithLink(
  title: string,
  description?: string,
  link?: ToastLinkOptions,
  action?: { label: string; onClick: () => void }
) {
  const message = description ? `${title}\n${description}` : title;
  
  return toast.warning(message, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    description: link ? `Click here: ${link.href}` : undefined,
  });
}

/**
 * Creates an error toast with a link
 */
export function toastErrorWithLink(
  title: string,
  description?: string,
  link?: ToastLinkOptions,
  action?: { label: string; onClick: () => void }
) {
  const message = description ? `${title}\n${description}` : title;
  
  return toast.error(message, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    description: link ? `Click here: ${link.href}` : undefined,
  });
}

/**
 * Example usage functions for common scenarios
 */
export const ToastExamples = {
  // New feature announcement
  announceNewFeature: (featureName: string, featureUrl: string) => {
    return toastSuccessWithLink(
      `🎉 New Feature Available!`,
      `Check out our new ${featureName} feature.`,
      {
        href: featureUrl,
        text: `Try ${featureName} now`,
        target: '_self'
      }
    );
  },

  // Voice contact promotion
  promoteVoiceContact: () => {
    return toastInfoWithLink(
      `🎤 Voice Contact Available`,
      `Prefer speaking over typing? Try our new voice contact feature.`,
      {
        href: '/voice-contact',
        text: 'Try Voice Contact',
        target: '_self'
      }
    );
  },

  // Help documentation
  showHelp: (helpTopic: string, helpUrl: string) => {
    return toastInfoWithLink(
      `Need Help with ${helpTopic}?`,
      `Check out our comprehensive guide.`,
      {
        href: helpUrl,
        text: 'View Help Guide',
        target: '_blank'
      }
    );
  },

  // Update notification
  notifyUpdate: (updateDetails: string, changelogUrl: string) => {
    return toastInfoWithLink(
      `📱 App Updated`,
      updateDetails,
      {
        href: changelogUrl,
        text: 'View Changelog',
        target: '_blank'
      }
    );
  }
};