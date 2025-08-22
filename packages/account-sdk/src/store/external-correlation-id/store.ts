import { createStore } from 'zustand/vanilla';

type ExternalCorrelationIdState = {
  externalCorrelationId: string | null;
};

const externalCorrelationIdStore = createStore<ExternalCorrelationIdState>(() => ({
  externalCorrelationId: null,
}));

export const externalCorrelationIds = {
  get: (): string | null => {
    return externalCorrelationIdStore.getState().externalCorrelationId;
  },
  set: (externalCorrelationId: string) => {
    externalCorrelationIdStore.setState({ externalCorrelationId });
  },
  clear: () => {
    externalCorrelationIdStore.setState({ externalCorrelationId: null });
  },
};
