import { useEffect, EffectCallback, DependencyList, useRef } from 'react';
import lodash from 'lodash';

/**
 * Inspired by https://github.com/kentcdodds/use-deep-compare-effect
 * React useEffect performs a reference equality check for its non-primitive
 * dependencies.
 *
 * If obj is an object that is a state, and useEffect has a dependency
 * on obj.field, where obj.field is non-primitive, issues can arise.
 * The Effect will re-run on every state change to obj even if the value of
 * obj.field remains the same, since the state change changed the reference
 * of obj.
 *
 * This hook keeps track of the previous dependency list and performs a deep
 * comparison with the new dependency list. The Effect is re-run only if the
 * deep comparison is false.
 */
export default function useDeepCompareEffect(
  callback: EffectCallback,
  dependencies: DependencyList
): void {
  const ref = useRef<DependencyList>([]);

  if (!lodash.isEqual(dependencies, ref.current)) {
    ref.current = lodash.cloneDeep(dependencies);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useEffect(callback, ref.current);
}
