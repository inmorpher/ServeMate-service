import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { FoodItemsController } from './food-items.controller';
import { FoodItemsRepository } from './food-items.repository';
import { IFoodItemsRepository } from './food-items.repository.interface';
import { FoodItemsService } from './food-items.service';
import { IFoodItemsService } from './food-items.service.interface';

export const foodItemsContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IFoodItemsRepository>(TYPES.FoodItemsRepository)
      .to(FoodItemsRepository)
      .inSingletonScope();
    bind<IFoodItemsService>(TYPES.FoodItemsService)
      .to(FoodItemsService)
      .inSingletonScope();
    bind<FoodItemsController>(TYPES.FoodItemsController)
      .to(FoodItemsController)
      .inSingletonScope();
  }
);
