export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="ds-error-state" role="alert">
      <h3 className="ds-error-state__title">Error</h3>
      <p className="ds-error-state__message">{message}</p>
      {onRetry && (
        <button className="ds-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
