"use client"
import { InputExtend } from "@/types/input";
import { useTranslations } from "next-intl";
import { Translated } from "@/components/i18n/Translated";
import { INPUT_FILTER, inputValue } from "@/utils/regex/input";
import React, { memo, useCallback, useState, useEffect } from "react";

/**
 * Enhanced Input Component with validation and internationalization
 * 
 * A comprehensive form input component that provides:
 * - Real-time input validation with customizable rules
 * - Internationalized labels and error messages
 * - Input filtering and text processing
 * - Support for IME composition (Korean, Japanese, Chinese)
 * - Configurable validation timing (onChange vs onBlur)
 * - Password confirmation validation
 * - Automatic error display with styling
 * 
 * @component
 * @example
 * ```tsx
 * <Input
 *   id="email"
 *   name="email"
 *   type="email"
 *   required
 *   value={formData.email}
 *   onChange={(e) => setFormData({...formData, email: e.target.value})}
 *   OnChange={true}  // Validate on every change
 *   showError={true}
 * />
 * 
 * // Password confirmation example
 * <Input
 *   id="confirmPassword"
 *   name="confirmPassword"
 *   type="password"
 *   compareValue={formData.password}  // Compare with original password
 *   OnChange={true}
 * />
 * ```
 * 
 * @param props - InputExtend interface with validation and behavior options
 * @returns JSX.Element - Memoized input component with label and error display
 */
export const Input = memo(function Input({
    id,
    type,
    className,
    required,
    name,
    value = "",
    compareValue="",
    disabled,
    showError = true,
    OnChange = false,
    OnBlur = true,
    autoComplete,
    onChange: externalOnChange,
}: InputExtend) {
    const [typing, setTyping] = useState(false);
    const [text, setText] = useState(value);
    const [error, setError] = useState("");
    const Message = useTranslations("messages");

    /**
     * Process and filter input text based on field type
     * Handles IME composition states and applies input filters
     * @param rawValue - Raw input string from user
     * @param forceFilter - Whether to force filtering even during IME composition
     */
    const processInput = useCallback((rawValue: string, forceFilter = false) => {
        if (typing && !forceFilter) {
            // During IME composition, don't filter to avoid interfering with input
            setText(rawValue);
            return;
        }
        // Apply field-specific filters (e.g., email format, phone numbers)
        const filteredValue = INPUT_FILTER[name]?.(rawValue) ?? rawValue;
        setText(filteredValue);
    }, [name, typing]);

    /**
     * Validate field value and set error message
     * Uses internationalized validation messages
     * @param compareValue - Optional value to compare against (for password confirmation)
     */
    const validateField = useCallback((compareValue?: string) => {
        if (!showError) return;
        setError(inputValue(name, text, Message, compareValue) || "");
    }, [showError, name, text, Message]);

    useEffect(() => setText(value), [value]);

    useEffect(() => {
        if (OnChange && compareValue && name === 'confirmPassword') {
            validateField(compareValue);
        }
    }, [compareValue, OnChange, name, validateField]);

    useEffect(() => {
        if (error) {
            validateField(name === 'confirmPassword' ? compareValue : undefined);
        }
    }, [Message, error, name, compareValue, validateField]);

    /**
     * Handle input change events
     * Processes input, calls external onChange, and validates if configured
     */
    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        processInput(e.target.value);
        externalOnChange?.(e);
        if (OnChange && !typing) {
            setTimeout(() => validateField(name === 'confirmPassword' ? compareValue : undefined), 0);
        }
    }, [processInput, externalOnChange, OnChange, typing, validateField, compareValue, name]);

    /**
     * Handle IME composition start (for Asian languages)
     * Sets typing state to prevent premature filtering
     */
    const onTyping = useCallback(() => setTyping(true), []);

    /**
     * Handle IME composition end
     * Forces input filtering and validation after composition
     */
    const endTyping = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
        setTyping(false);
        processInput(e.currentTarget.value, true);
        if (OnChange) {
            setTimeout(() => validateField(name === 'confirmPassword' ? compareValue : undefined), 0);
        }
    }, [processInput, OnChange, validateField, name, compareValue]);

    /**
     * Handle input blur events
     * Validates field when user leaves the input (if OnBlur is enabled)
     */
    const onBlur = useCallback(() => {
        if (OnBlur) {
            validateField(name === 'confirmPassword' ? compareValue : undefined);
        }
    }, [OnBlur, validateField, name, compareValue]);


    return (
        <div className="w-full flex flex-col relative pb-1">
            {id && <label className="block text-sm mb-1 font-bold ml-0.5 text-[var(--text-color)]" htmlFor={id}>{Translated("input", name)}</label>}
            <input
                id={id}
                type={type}
                name={name}
                placeholder={Translated("input", name)}
                className={`${className} focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out text-[var(--text-color)]`}
                required={required}
                value={text}
                onChange={onChange}
                onCompositionStart={onTyping}
                onCompositionEnd={endTyping}
                onBlur={onBlur}
                disabled={disabled}
                autoComplete={autoComplete}
            />
            {showError && error && (
                <p className="text-red-500 text-sm font-bold break-all mt-1">{error}</p>
            )}
        </div>
    );
});