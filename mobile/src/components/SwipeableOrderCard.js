import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

const SwipeableOrderCard = ({ children, onDelete, orderId }) => {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={async () => {
          try {
            // call parent delete handler which should handle errors
            await onDelete(orderId);
          } catch (e) {
            // parent will show alerts; swallow here
          } finally {
            if (swipeableRef.current) swipeableRef.current.close();
          }
        }}
      >
        <Animated.View style={[styles.deleteBox, { transform: [{ scale }] }]}>
          <Text style={styles.deleteText}>Sil</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  deleteBox: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginRight: 12,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SwipeableOrderCard;
