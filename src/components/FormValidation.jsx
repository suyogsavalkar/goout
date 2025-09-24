"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced Input with validation
export const ValidatedInput = ({
  label,
  error,
  success,
  loading,
  required = false,
  type = 'text',
  validator = null,
  asyncValidator = null,
  debounceMs = 500,
  className = '',
  ...props
}) => {
  const [internalError, setInternalError] = useState('');
  const [internalSuccess, setInternalSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = error || internalError;
  const hasSuccess = success || internalSuccess;
  const isLoading = loading || isValidating;

  // Debounced validation
  useEffect(() => {
    if (!props.value || !validator) return;

    const timeoutId = setTimeout(async () => {
      try {
        // Sync validation
        if (validator) {
          const result = validator(props.value);
          if (result !== true) {
            setInternalError(result);
            setInternalSuccess('');
            return;
          }
        }

        // Async validation
        if (asyncValidator) {
          setIsValidating(true);
          const result = await asyncValidator(props.value);
          if (result !== true) {
            setInternalError(result);
            setInternalSuccess('');
          } else {
            setInternalError('');
            setInternalSuccess('Valid');
          }
          setIsValidating(false);
        } else if (validator) {
          setInternalError('');
          setInternalSuccess('Valid');
        }
      } catch (err) {
        setInternalError('Validation failed');
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [props.value, validator, asyncValidator, debounceMs]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="flex items-center space-x-1">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          {...props}
          type={inputType}
          className={cn(
            hasError && 'border-red-500 focus:border-red-500',
            hasSuccess && !hasError && 'border-green-500 focus:border-green-500',
            type === 'password' && 'pr-10',
            className
          )}
        />
        
        {/* Password toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        
        {/* Status icons */}
        {!isLoading && (hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p className="text-sm text-red-500 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{hasError}</span>
        </p>
      )}
      
      {/* Success message */}
      {hasSuccess && !hasError && (
        <p className="text-sm text-green-500 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>{hasSuccess}</span>
        </p>
      )}
    </div>
  );
};

// Enhanced Textarea with validation
export const ValidatedTextarea = ({
  label,
  error,
  success,
  required = false,
  validator = null,
  maxLength = null,
  className = '',
  ...props
}) => {
  const [internalError, setInternalError] = useState('');
  const [charCount, setCharCount] = useState(0);

  const hasError = error || internalError;
  const hasSuccess = success && !hasError;

  useEffect(() => {
    const value = props.value || '';
    setCharCount(value.length);

    if (validator && value) {
      const result = validator(value);
      if (result !== true) {
        setInternalError(result);
      } else {
        setInternalError('');
      }
    }
  }, [props.value, validator]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </div>
          {maxLength && (
            <span className={cn(
              "text-xs",
              charCount > maxLength ? "text-red-500" : "text-gray-500"
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </Label>
      )}
      
      <Textarea
        {...props}
        className={cn(
          hasError && 'border-red-500 focus:border-red-500',
          hasSuccess && 'border-green-500 focus:border-green-500',
          className
        )}
      />
      
      {/* Error message */}
      {hasError && (
        <p className="text-sm text-red-500 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{hasError}</span>
        </p>
      )}
      
      {/* Success message */}
      {hasSuccess && (
        <p className="text-sm text-green-500 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>{hasSuccess}</span>
        </p>
      )}
    </div>
  );
};

// Form validation hook
export const useFormValidation = (initialValues = {}, validators = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const setTouched = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateField = (field, value) => {
    const validator = validators[field];
    if (!validator) return '';

    if (typeof validator === 'function') {
      const result = validator(value);
      return result === true ? '' : result;
    }

    if (Array.isArray(validator)) {
      for (const v of validator) {
        const result = v(value);
        if (result !== true) return result;
      }
    }

    return '';
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validators).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    try {
      const isValid = validateAll();
      if (!isValid) {
        setIsSubmitting(false);
        return false;
      }

      await onSubmit(values);
      setIsSubmitting(false);
      return true;
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouched,
    validateField,
    validateAll,
    handleSubmit,
    reset
  };
};

// Common validators
export const validators = {
  required: (message = 'This field is required') => (value) => {
    return value && value.toString().trim() ? true : message;
  },

  minLength: (min, message) => (value) => {
    const msg = message || `Must be at least ${min} characters`;
    return value && value.length >= min ? true : msg;
  },

  maxLength: (max, message) => (value) => {
    const msg = message || `Must be no more than ${max} characters`;
    return !value || value.length <= max ? true : msg;
  },

  email: (message = 'Please enter a valid email address') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !value || emailRegex.test(value) ? true : message;
  },

  umichEmail: (message = 'Must be a University of Michigan email (@umich.edu)') => (value) => {
    return !value || value.endsWith('@umich.edu') ? true : message;
  },

  username: (message = 'Username must be 3-20 characters and contain only letters, numbers, and underscores') => (value) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return !value || usernameRegex.test(value) ? true : message;
  },

  url: (message = 'Please enter a valid URL') => (value) => {
    try {
      return !value || new URL(value) ? true : message;
    } catch {
      return message;
    }
  },

  number: (message = 'Please enter a valid number') => (value) => {
    return !value || !isNaN(Number(value)) ? true : message;
  },

  min: (min, message) => (value) => {
    const msg = message || `Must be at least ${min}`;
    return !value || Number(value) >= min ? true : msg;
  },

  max: (max, message) => (value) => {
    const msg = message || `Must be no more than ${max}`;
    return !value || Number(value) <= max ? true : msg;
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    return !value || regex.test(value) ? true : message;
  },

  custom: (validatorFn, message = 'Invalid value') => (value) => {
    try {
      return validatorFn(value) ? true : message;
    } catch {
      return message;
    }
  }
};