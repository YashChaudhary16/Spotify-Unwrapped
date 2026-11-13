import { createContext, useContext } from 'react';

/**
 * Lets something inside a card (e.g. an open ⋯ menu) hold the story still.
 * `hold(id, true)` pauses, `hold(id, false)` releases; the story plays again when nothing holds it.
 */
export const StoryHoldContext = createContext<(id: string, held: boolean) => void>(() => {});
export const useStoryHold = () => useContext(StoryHoldContext);
