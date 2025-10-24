interface TransactionStatusProps {
  hash?: `0x${string}`;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
}

export function TransactionStatus({ hash, isConfirming, isSuccess, error }: TransactionStatusProps) {
  if (!hash && !error) return null;

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
      {hash && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Transaction Hash:</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
            >
              View on Explorer
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="font-mono text-xs text-gray-300 break-all">{hash}</p>

          {isConfirming && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm mt-3">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Waiting for confirmation...
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm mt-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Transaction confirmed!
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Transaction failed</p>
            <p className="text-xs mt-1">{error.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
