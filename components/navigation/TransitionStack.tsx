/**
 * Expo Router integration for react-native-screen-transitions.
 *
 * Wraps the BlankStackNavigator with withLayoutContext so it
 * works seamlessly with file-based routing.
 */

import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import {
  createBlankStackNavigator,
  type BlankStackNavigationEventMap,
  type BlankStackNavigationOptions,
} from 'react-native-screen-transitions/blank-stack';

const { Navigator } = createBlankStackNavigator();

/**
 * Drop-in replacement for expo-router's <Stack> that uses
 * react-native-screen-transitions under the hood.
 */
export const TransitionStack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BlankStackNavigationEventMap
>(Navigator);
