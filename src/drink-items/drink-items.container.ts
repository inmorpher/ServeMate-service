import { ContainerModule, ContainerModuleLoadOptions } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { DrinkItemsController } from './drink-items.controller';
import { DrinkItemsRepository } from './drink-items.repository';
import { IDrinkItemsRepository } from './drink-items.repository.interface';
import { DrinkItemsService } from './drink-items.service';
import { IDrinkItemsService } from './drink-items.service.interface';

export const drinkItemsContainerModule = new ContainerModule(
  ({ bind }: ContainerModuleLoadOptions) => {
    bind<IDrinkItemsRepository>(TYPES.DrinkItemsRepository)
      .to(DrinkItemsRepository)
      .inSingletonScope();
    bind<IDrinkItemsService>(TYPES.DrinkItemsService)
      .to(DrinkItemsService)
      .inSingletonScope();
    bind<DrinkItemsController>(TYPES.DrinkItemsController)
      .to(DrinkItemsController)
      .inSingletonScope();
  }
);
