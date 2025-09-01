"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Palette } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import type { CollageConfig, LayoutStyle } from "~/lib/types";

const collageConfigSchema = z.object({
  width_inches: z.number().min(4).max(48),
  height_inches: z.number().min(4).max(48),
  dpi: z.number().min(72).max(300),
  layout_style: z.enum(["masonry", "grid", "random", "spiral"]),
  spacing: z.number().min(0).max(50),
  background_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  maintain_aspect_ratio: z.boolean(),
  apply_shadow: z.boolean(),
});

type CollageConfigForm = z.infer<typeof collageConfigSchema>;

interface ConfigurationPanelProps {
  onCreateCollage: (config: CollageConfig) => void;
  isLoading: boolean;
  disabled: boolean;
}

const DEFAULT_CONFIG: CollageConfigForm = {
  width_inches: 12,
  height_inches: 16,
  dpi: 150,
  layout_style: "masonry",
  spacing: 5,
  background_color: "#FFFFFF",
  maintain_aspect_ratio: true,
  apply_shadow: false,
};

export function ConfigurationPanel({
  onCreateCollage,
  isLoading,
  disabled,
}: ConfigurationPanelProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CollageConfigForm>({
    resolver: zodResolver(collageConfigSchema),
    defaultValues: DEFAULT_CONFIG,
  });

  const backgroundColor = watch("background_color");

  const onSubmit = (data: CollageConfigForm) => {
    onCreateCollage(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collage Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dimensions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="width_inches">Width (inches)</Label>
              <Input
                id="width_inches"
                type="number"
                step="0.1"
                min="4"
                max="48"
                {...register("width_inches", { valueAsNumber: true })}
                disabled={disabled}
              />
              {errors.width_inches && (
                <p className="text-sm text-red-600">
                  {errors.width_inches.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height_inches">Height (inches)</Label>
              <Input
                id="height_inches"
                type="number"
                step="0.1"
                min="4"
                max="48"
                {...register("height_inches", { valueAsNumber: true })}
                disabled={disabled}
              />
              {errors.height_inches && (
                <p className="text-sm text-red-600">
                  {errors.height_inches.message}
                </p>
              )}
            </div>
          </div>

          {/* DPI */}
          <div className="space-y-2">
            <Label htmlFor="dpi">DPI (Resolution)</Label>
            <Input
              id="dpi"
              type="number"
              min="72"
              max="300"
              {...register("dpi", { valueAsNumber: true })}
              disabled={disabled}
            />
            {errors.dpi && (
              <p className="text-sm text-red-600">{errors.dpi.message}</p>
            )}
          </div>

          {/* Layout Style */}
          <div className="space-y-2">
            <Label htmlFor="layout_style">Layout Style</Label>
            <Select
              value={watch("layout_style")}
              onValueChange={(value: LayoutStyle) =>
                setValue("layout_style", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layout style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="spiral">Spiral</SelectItem>
              </SelectContent>
            </Select>
            {errors.layout_style && (
              <p className="text-sm text-red-600">
                {errors.layout_style.message}
              </p>
            )}
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <Label htmlFor="spacing">Spacing (pixels)</Label>
            <Input
              id="spacing"
              type="number"
              min="0"
              max="50"
              {...register("spacing", { valueAsNumber: true })}
              disabled={disabled}
            />
            {errors.spacing && (
              <p className="text-sm text-red-600">{errors.spacing.message}</p>
            )}
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-12 border-2 p-0"
                    style={{ backgroundColor }}
                    disabled={disabled}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={backgroundColor}
                    onChange={(color) => setValue("background_color", color)}
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) =>
                      setValue("background_color", e.target.value)
                    }
                    placeholder="#FFFFFF"
                    className="mt-2"
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={backgroundColor}
                onChange={(e) => setValue("background_color", e.target.value)}
                placeholder="#FFFFFF"
                disabled={disabled}
              />
            </div>
            {errors.background_color && (
              <p className="text-sm text-red-600">
                {errors.background_color.message}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintain_aspect_ratio"
                checked={watch("maintain_aspect_ratio")}
                onCheckedChange={(checked) =>
                  setValue("maintain_aspect_ratio", !!checked)
                }
                disabled={disabled}
              />
              <Label htmlFor="maintain_aspect_ratio">
                Maintain aspect ratio
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="apply_shadow"
                checked={watch("apply_shadow")}
                onCheckedChange={(checked) =>
                  setValue("apply_shadow", !!checked)
                }
                disabled={disabled}
              />
              <Label htmlFor="apply_shadow">Apply shadow effects</Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || disabled}
          >
            {isLoading ? "Creating Collage..." : "Create Collage"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
