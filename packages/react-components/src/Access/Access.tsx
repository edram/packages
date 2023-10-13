export type AccessProps = {
  accessible: boolean;
  fallback?: React.ReactNode;
};

const Access: React.FC<React.PropsWithChildren<AccessProps>> = ({
  accessible,
  fallback,
  children,
}) => {
  if (!accessible) {
    return fallback;
  }

  return children;
};

export { Access };
