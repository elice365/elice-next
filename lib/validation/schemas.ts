/**
 * Zod-based validation schemas for form validation
 * Consolidates duplicate validation logic across the application
 */
import { z } from 'zod';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z가-힣\s]+$/, 'Name can only contain letters and spaces');

// Auth-related schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Less strict for login
  fingerprint: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Admin-related schemas
export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  roles: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  roles: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// Blog-related schemas
export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Content is required'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  language: z.string().default('ko'),
});

export const updateBlogSchema = createBlogSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug is too long'),
  description: z.string().optional(),
  parentId: z.string().uuid('Invalid parent ID').optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Notification schemas
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  targetUsers: z.array(z.string().uuid()).optional(),
  startsTime: z.date().optional(),
  endsTime: z.date().optional(),
});

// Generic validation functions
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

// Helper for API request validation
export async function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<{
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}> {
  try {
    const body = await request.json();
    return validateWithSchema(schema, body);
  } catch (error) {
    return { 
      success: false, 
      errors: { general: 'Invalid JSON in request body' } 
    };
  }
}

// Type exports for better TypeScript support
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;