import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MinLength
} from 'class-validator';
import { Allergy, DrinkCategory, DrinkTemp, FoodCategory, FoodType, SpiceLevel } from '../dto-package/src/dto/enums';
import { ListPropsDto, SearchCriteriaDto } from './common.dto';

export class BaseItemDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsNumber()
  @Type(() => Number)
  price!: number;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item: string) => item.trim())
        .map((item: string) => item.charAt(0).toUpperCase() + item.slice(1).toLocaleLowerCase());
    }
    return value ?? [];
  })
  ingredients!: string[];

  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  isAvailable!: boolean;

  @IsNumber()
  @Type(() => Number)
  popularityScore!: number;

  @IsOptional()
  @IsString()
  image?: string | null;
}

export class DrinkItemDto extends BaseItemDto {
  @IsEnum(DrinkCategory)
  category!: DrinkCategory;

  @IsNumber()
  @Type(() => Number)
  volume!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  alcoholPercentage?: number | null;

  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return value;
  })
  isCarbonated!: boolean;

  @IsEnum(DrinkTemp)
  tempriture!: DrinkTemp;
}

export class FoodItemDto extends BaseItemDto {
  @IsEnum(FoodCategory)
  category!: FoodCategory;

  @IsEnum(FoodType)
  type!: FoodType;

  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isVegan!: boolean;

  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isGlutenFree!: boolean;

  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isVegetarian!: boolean;

  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((item: string) => item.trim().toUpperCase());
    }
    return value ?? [];
  })
  allergies!: Allergy[];

  @IsNumber()
  @Type(() => Number)
  preparationTime!: number;

  @IsEnum(SpiceLevel)
  spicyLevel!: SpiceLevel;

  @IsNumber()
  @Type(() => Number)
  calories!: number | null;
}

export class CreateDrinkItemDto extends DrinkItemDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;
}

export class CreateFoodItemDto extends FoodItemDto {
  @IsNumber()
  @Type(() => Number)
  id!: number;
}

export class UpdateDrinkItemDto {
  @IsOptional()
  @IsEnum(DrinkCategory)
  category?: DrinkCategory;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  volume?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  alcoholPercentage?: number | null;

  @IsOptional()
  @IsBoolean()
  isCarbonated?: boolean;

  @IsOptional()
  @IsEnum(DrinkTemp)
  tempriture?: DrinkTemp;
}

export class UpdateFoodItemDto {
  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsOptional()
  @IsEnum(FoodType)
  type?: FoodType;

  @IsOptional()
  @IsBoolean()
  isVegan?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlutenFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isVegetarian?: boolean;

  @IsOptional()
  @IsArray()
  allergies?: Allergy[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  preparationTime?: number;

  @IsOptional()
  @IsEnum(SpiceLevel)
  spicyLevel?: SpiceLevel;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  calories?: number | null;
}

export class SearchFoodItemsDto extends SearchCriteriaDto {
  @IsOptional()
  @IsString()
  sortBy?: string;
}

export class SearchDrinkItemsDto extends SearchCriteriaDto {
  @IsOptional()
  @IsString()
  sortBy?: string;
}

export class FoodItemsListDto extends ListPropsDto {
  @IsArray()
  items!: FoodItemDto[];
}

export class DrinkItemsListDto extends ListPropsDto {
  @IsArray()
  items!: DrinkItemDto[];
}
