/* eslint-disable @typescript-eslint/ban-types */
import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  useForm as useFormReactHookForm,
  FormProvider as FormProviderReactHookForm,
  useFormContext as useFormContextReactHookForm,
  UseFormReset,
  ErrorOption,
  Control,
} from "react-hook-form";
import { CriteriaMode, Mode } from "react-hook-form/dist/types/form";

type FormProps = {
  onSubmit?: Function;
};

type HookResponse = {
  submitForm?: (formData: any) => void;
  formErrors: { [key: string]: {} | undefined };
  resetForm: UseFormReset<{ [x: string]: {} | undefined }>;
  control: Control<{ [x: string]: {} | undefined }> | any;
  setFormValue: (
    name: string,
    value: any,
    config?: Record<string, unknown>
  ) => void;
  getFormValues: (payload?: string | string[]) => any;
  formState: {
    errors: any;
    isDirty: boolean;
    dirtyFields: Record<string, unknown>;
    touchedFields: Record<string, unknown>;
    isSubmitted: boolean;
    isSubmitting: boolean;
    submitCount: number;
    isValid: boolean;
  };
  validateForm: () => Promise<boolean>;
  unregister: (name: string) => void;
  setFocus: (name: string) => void;

  renderForm: (children: any, formProps?: FormProps) => any;
  watchForm: (name?: string) => any;
  setFormError: (fieldName: string, err: any) => void;
};

type HookParams = {
  onSubmit?: (data: Record<string, any>, e?: any) => any;
  onError?: (errors: Record<string, unknown>, e?: any) => void;
  callingSubmitManually?: boolean;

  defaultValues?: { [x: string]: {} | undefined } | undefined;
  mode?: Mode;
  reValidateMode?: Exclude<Mode, "onTouched" | "all">;
  criteriaMode?: CriteriaMode;
  schema?: any;
};

/**
 * Examples:
 *
 * setFormError("email", "This email is already used")
 * setFormError("password", ["Too short", "Mix different characters"])
 * setFormError("myField", { ...actual RHF error-compliant payload })
 *
 * @param setError
 */
const setFormErrorFactory =
  (setError: {
    (
      name: string,
      error: ErrorOption,
      options?: { shouldFocus: boolean } | undefined
    ): void;
    (
      name: string,
      error: ErrorOption,
      options?: { shouldFocus: boolean } | undefined
    ): void;
    (arg0: string, arg1: { type: string; message: any }): void;
  }) =>
  (fieldName: string, err: any) => {
    if (typeof err === "string") {
      setError(fieldName, { type: "manual", message: err });
    } else if (Array.isArray(err)) {
      setError(fieldName, { type: "manual", message: err[0] });
    } else {
      setError(fieldName, err);
    }
  };
// return (fieldName, err) => {
//   let errorPayload = err;
//
//   /*
//    * Function overloading
//    */
//   if (typeof err === "string") {
//     errorPayload = {
//       types: {
//         manual: err,
//       },
//     };
//   }
//   if (Array.isArray(err)) {
//     errorPayload = {
//       types: _.fromPairs(err.map((e, idx) => [`manual${idx}`, e])),
//     };
//   }
//
//   setError(fieldName, errorPayload);
// };
const defaultFormParams = {
  mode: "onBlur" as Mode,
  reValidateMode: "onBlur" as Exclude<Mode, "onTouched" | "all">,
  criteriaMode: "all" as CriteriaMode,
};

export default function useForm(params: HookParams = {}): HookResponse {
  const {
    onSubmit,
    onError,
    callingSubmitManually = false,
    schema,
    ...otherParams
  } = params;

  const useFormReactHookFormPayload = useFormReactHookForm({
    ...defaultFormParams,
    ...otherParams,
    resolver: schema ? yupResolver(schema) : undefined,
  });

  const {
    handleSubmit,
    reset,
    formState,
    setValue,
    getValues,
    trigger,
    watch,
    setError,
    unregister,
    setFocus,
    control,
  } = useFormReactHookFormPayload;

  const { errors } = formState ?? {};

  // @ts-ignore
  const handleSubmitBound = onSubmit
    ? handleSubmit(onSubmit, onError)
    : // Would be undefined traditionally, but let's make this more developer friendly
      () =>
        console.error(
          "You tried calling `submitForm` but forgot to set `onSubmit` callback for it"
        );

  // Magic 🎉

  const renderForm = (children: React.ReactNode, formProps = {}) => (
    <FormProviderReactHookForm {...useFormReactHookFormPayload}>
      <form
        onSubmit={
          onSubmit && !callingSubmitManually ? handleSubmitBound : undefined
        }
        {...formProps}
      >
        {children}
      </form>
    </FormProviderReactHookForm>
  );

  return {
    submitForm: handleSubmitBound,
    formErrors: errors,
    resetForm: reset,
    setFormValue: setValue,
    getFormValues: getValues,
    validateForm: trigger,
    formState,
    renderForm,
    watchForm: watch,
    setFormError: setFormErrorFactory(setError),
    unregister,
    setFocus,
    control,
  };
}

export function useFormContext() {
  const {
    handleSubmit,
    formState,
    watch,
    reset,
    getValues,
    setValue,
    trigger,
    setError,
    unregister,
    setFocus,
    clearErrors,
  } = useFormContextReactHookForm() ?? {};

  const { errors } = formState ?? {};

  return {
    errors,
    handleSubmit,
    formState,
    watch,
    reset,
    getValues,
    setValue,
    validateForm: trigger,
    setFormError: setFormErrorFactory(setError),
    // Aliasing
    formErrors: errors,
    resetForm: reset,
    setFormValue: setValue,
    getFormValues: getValues,
    watchForm: watch,
    unregister,
    setFocus,
    clearErrors,
  };
}

export function FormContext(props: { children: any }) {
  const { children } = props;

  const context = useFormContext();

  return children(context);
}

export function FormProvider(props: { [x: string]: any; children: any }) {
  const { children, ...otherProps } = props;

  const useFormReactHookFormPayload = useFormReactHookForm({
    ...defaultFormParams,
    ...otherProps,
  });

  return (
    <FormProviderReactHookForm {...useFormReactHookFormPayload}>
      {children}
    </FormProviderReactHookForm>
  );
}
