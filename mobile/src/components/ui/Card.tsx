import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../constants/theme';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    children: React.ReactNode;
}

export const Card = ({ style, variant = 'elevated', children, ...props }: CardProps) => {
    return (
        <View
            style={[
                styles.base,
                variant === 'elevated' && styles.elevated,
                variant === 'outlined' && styles.outlined,
                variant === 'flat' && styles.flat,
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
    },
    elevated: {
        ...theme.shadows.card,
    },
    outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    flat: {
        // No shadow, just background
    },
});
