'use client';

import { useState, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface WizardStep {
    title: string;
    description?: string;
    component: ReactNode;
}

interface FormWizardProps {
    steps: WizardStep[];
    onComplete: () => void | Promise<void>;
    onCancel?: () => void;
}

export default function FormWizard({ steps, onComplete, onCancel }: FormWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCompletedSteps([...completedSteps, currentStep]);
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await onComplete();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* Progress Steps */}
            <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={index} className="flex-1 flex items-center">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                        ${index < currentStep || completedSteps.includes(index)
                                            ? 'bg-success text-white'
                                            : index === currentStep
                                                ? 'bg-primary text-white ring-4 ring-primary/20'
                                                : 'bg-gray-200 text-gray-500'
                                        }
                                    `}
                                >
                                    {completedSteps.includes(index) ? (
                                        <Check size={20} />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <div
                                        className={`text-xs font-medium ${index === currentStep
                                                ? 'text-primary'
                                                : 'text-gray-500'
                                            }`}
                                    >
                                        {step.title}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                                        flex-1 h-1 mx-2 rounded transition-colors
                                        ${completedSteps.includes(index) || index < currentStep
                                            ? 'bg-success'
                                            : 'bg-gray-200'
                                        }
                                    `}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
            >
                {steps[currentStep].description && (
                    <p className="text-sm text-gray-600 mb-4">
                        {steps[currentStep].description}
                    </p>
                )}
                {steps[currentStep].component}
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between px-6 py-4 bg-gray-50 border-t">
                <button
                    type="button"
                    onClick={isFirstStep ? onCancel : handleBack}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    disabled={isSubmitting}
                >
                    {isFirstStep ? 'Cancel' : 'Back'}
                </button>

                <button
                    type="button"
                    onClick={isLastStep ? handleComplete : handleNext}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : isLastStep ? (
                        'Complete'
                    ) : (
                        'Next Step →'
                    )}
                </button>
            </div>
        </div>
    );
}
