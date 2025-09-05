"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Palette } from "lucide-react";
import { useEffect } from "react";
import { HexAlphaColorPicker, HexColorPicker } from "react-colorful";
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

import type { CollageFormConfig, LayoutStyle, OutputFormat } from "~/lib/types";

type Mode = "mm" | "px";
const baseSchema = {
  dpi: z.number().min(72).max(300),
  layout_style: z.enum(["masonry", "grid"]),
  spacing: z.number().min(0).max(100),
  background_color: z.string().regex(/^#[0-9A-F]{6}([0-9A-F]{2})?$/i),
  maintain_aspect_ratio: z.boolean(),
  apply_shadow: z.boolean(),
  output_format: z.enum(["jpeg", "png", "tiff"]).optional(),
  transparency: z.boolean().optional(),
};

const collageConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("mm" as const),
    width_mm: z.number().min(50).max(1219.2),
    height_mm: z.number().min(50).max(1219.2),
    ...baseSchema,
  }),
  z.object({
    mode: z.literal("px" as const),
    width_px: z.number().min(320).max(20000),
    height_px: z.number().min(320).max(20000),
    ...baseSchema,
  }),
]);

type CollageConfigForm = z.infer<typeof collageConfigSchema>;

interface ConfigurationPanelProps {
  onCreateCollage: (config: CollageFormConfig) => void;
  onOptimizeGrid?: (config: CollageFormConfig) => void;
  isLoading: boolean;
  disabled: boolean;
  isOptimizingGrid?: boolean;
  hasGridOptimization?: boolean;
  currentLayoutStyle?: string;
}

const DEFAULT_CONFIG: CollageConfigForm = {
  mode: "mm",
  width_mm: 150,
  height_mm: 100,
  dpi: 150,
  layout_style: "grid",
  spacing: 30.0,
  background_color: "#FFFFFF",
  maintain_aspect_ratio: true,
  apply_shadow: false,
  output_format: "jpeg",
  transparency: false,
};

export function ConfigurationPanel({
  onCreateCollage,
  onOptimizeGrid,
  isLoading,
  disabled,
  isOptimizingGrid = false,
  hasGridOptimization = false,
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
  const currentLayoutStyle = watch("layout_style");
  const outputFormat = watch("output_format");
  const transparency = watch("transparency");
  const mode = watch("mode");
  const formErrors = errors as unknown as Record<string, { message?: string }>;

  // Handle transparency logic
  useEffect(() => {
    if (outputFormat === "png" && transparency) {
      setValue("background_color", "#00000000");
    } else if (outputFormat !== "png" && transparency) {
      setValue("transparency", false);
    }
  }, [outputFormat, transparency, setValue]);

  const onSubmit = (data: CollageConfigForm) => {
    const config: CollageFormConfig = {
      ...(data as unknown as CollageFormConfig),
    };
    if (data.output_format === "png" && data.transparency) {
      config.background_color = "#00000000";
    }
    onCreateCollage(config);
  };

  const handleOptimizeGrid = () => {
    if (!onOptimizeGrid) return;
    const data = watch();
    onOptimizeGrid(data as unknown as CollageFormConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collage Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mode Switch */}
          <div className="space-y-2">
            <Label htmlFor="mode">Canvas Type</Label>
            <Select
              value={mode}
              onValueChange={(value: Mode) => {
                setValue("mode", value);
                if (value === "px") {
                  setValue("dpi", 96);
                  setValue("width_px", 1920);
                  setValue("height_px", 1080);
                } else {
                  setValue("dpi", 150);
                  setValue("width_mm", 150);
                  setValue("height_mm", 100);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select canvas type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">Print (millimeters)</SelectItem>
                <SelectItem value="px">Screen (pixels)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions */}
          {mode === "mm" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="width_mm">Width (mm)</Label>
                <Input
                  id="width_mm"
                  type="number"
                  step="0.1"
                  min="50"
                  max="1219.2"
                  {...register("width_mm", { valueAsNumber: true })}
                  disabled={disabled}
                />
                {formErrors.width_mm?.message && (
                  <p className="text-sm text-red-600">
                    {formErrors.width_mm.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height_mm">Height (mm)</Label>
                <Input
                  id="height_mm"
                  type="number"
                  step="0.1"
                  min="50"
                  max="1219.2"
                  {...register("height_mm", { valueAsNumber: true })}
                  disabled={disabled}
                />
                {formErrors.height_mm?.message && (
                  <p className="text-sm text-red-600">
                    {formErrors.height_mm.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="width_px">Width (px)</Label>
                  <Input
                    id="width_px"
                    type="number"
                    min="320"
                    max="20000"
                    {...register("width_px", { valueAsNumber: true })}
                    disabled={disabled}
                  />
                  {formErrors.width_px?.message && (
                    <p className="text-sm text-red-600">
                      {formErrors.width_px.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height_px">Height (px)</Label>
                  <Input
                    id="height_px"
                    type="number"
                    min="320"
                    max="20000"
                    {...register("height_px", { valueAsNumber: true })}
                    disabled={disabled}
                  />
                  {formErrors.height_px?.message && (
                    <p className="text-sm text-red-600">
                      {formErrors.height_px.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Pixel Presets */}
              <div className="space-y-2">
                <Label htmlFor="pixel_preset">Presets (pixels)</Label>
                <Select
                  onValueChange={(value: string) => {
                    const [wStr, hStr] = value.split("x");
                    const w = parseInt(wStr ?? "", 10);
                    const h = parseInt(hStr ?? "", 10);
                    if (Number.isFinite(w) && Number.isFinite(h)) {
                      setValue("width_px", w);
                      setValue("height_px", h);
                    }
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1080x1080">
                      Instagram Post – 1080×1080
                    </SelectItem>
                    <SelectItem value="1080x1350">
                      Instagram Portrait – 1080×1350
                    </SelectItem>
                    <SelectItem value="1080x566">
                      Instagram Landscape – 1080×566
                    </SelectItem>
                    <SelectItem value="1080x1920">
                      Stories/Reels – 1080×1920
                    </SelectItem>
                    <SelectItem value="1200x630">
                      Facebook Post – 1200×630
                    </SelectItem>
                    <SelectItem value="1200x675">
                      Twitter/X – 1200×675
                    </SelectItem>
                    <SelectItem value="1200x627">
                      LinkedIn Post – 1200×627
                    </SelectItem>
                    <SelectItem value="1000x1500">
                      Pinterest – 1000×1500
                    </SelectItem>
                    <SelectItem value="1920x1080">
                      Desktop FHD – 1920×1080
                    </SelectItem>
                    <SelectItem value="2560x1440">
                      Desktop QHD – 2560×1440
                    </SelectItem>
                    <SelectItem value="3840x2160">
                      Desktop 4K – 3840×2160
                    </SelectItem>
                    <SelectItem value="2560x1600">
                      Desktop 16:10 – 2560×1600
                    </SelectItem>
                    <SelectItem value="3440x1440">
                      Ultrawide – 3440×1440
                    </SelectItem>
                    <SelectItem value="1080x2400">
                      Phone Portrait – 1080×2400
                    </SelectItem>
                    <SelectItem value="2400x1080">
                      Phone Landscape – 2400×1080
                    </SelectItem>
                    <SelectItem value="1440x3200">
                      Phone QHD+ Portrait – 1440×3200
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
              </SelectContent>
            </Select>
            {errors.layout_style && (
              <p className="text-sm text-red-600">
                {errors.layout_style.message}
              </p>
            )}
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label htmlFor="output_format">Output Format</Label>
            <Select
              value={outputFormat ?? "jpeg"}
              onValueChange={(value: OutputFormat) =>
                setValue("output_format", value)
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG (Smallest file size)</SelectItem>
                <SelectItem value="png">PNG (Supports transparency)</SelectItem>
                <SelectItem value="tiff">
                  TIFF (High-quality printing)
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.output_format && (
              <p className="text-sm text-red-600">
                {errors.output_format.message}
              </p>
            )}
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <Label htmlFor="spacing">Spacing (%)</Label>
            <Input
              id="spacing"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register("spacing", { valueAsNumber: true })}
              disabled={disabled}
            />
            <p className="text-xs text-gray-500">
              Percentage of canvas dimensions for consistent spacing across
              different output sizes
            </p>
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
                  {outputFormat === "png" ? (
                    <HexAlphaColorPicker
                      color={backgroundColor}
                      onChange={(color) => setValue("background_color", color)}
                    />
                  ) : (
                    <HexColorPicker
                      color={backgroundColor}
                      onChange={(color) => setValue("background_color", color)}
                    />
                  )}
                  <Input
                    value={backgroundColor}
                    onChange={(e) =>
                      setValue("background_color", e.target.value)
                    }
                    placeholder={
                      outputFormat === "png" ? "#FFFFFF00" : "#FFFFFF"
                    }
                    className="mt-2"
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={backgroundColor}
                onChange={(e) => setValue("background_color", e.target.value)}
                placeholder={outputFormat === "png" ? "#FFFFFF00" : "#FFFFFF"}
                disabled={disabled}
              />
            </div>
            {errors.background_color && (
              <p className="text-sm text-red-600">
                {errors.background_color.message}
              </p>
            )}
          </div>

          {/* Transparency Option */}
          {outputFormat === "png" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transparency"
                  checked={transparency ?? false}
                  onCheckedChange={(checked) =>
                    setValue("transparency", !!checked)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="transparency">
                  Enable transparency (sets background to transparent)
                </Label>
              </div>
            </div>
          )}

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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {onOptimizeGrid && currentLayoutStyle === "grid" && (
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1"
                onClick={handleOptimizeGrid}
                disabled={isOptimizingGrid || disabled}
              >
                {isOptimizingGrid ? "📐 Optimizing..." : "📐 Optimize Grid"}
              </Button>
            )}
            <Button
              type="submit"
              className={`min-w-0 flex-1 ${hasGridOptimization ? "flex-none" : ""}`}
              disabled={isLoading || disabled}
            >
              {isLoading ? "Creating Collage..." : "Create Collage"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
