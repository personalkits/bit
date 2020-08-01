import { Component } from '../component';
import ConsumerComponent from '../../consumer/component';
import { Dependencies } from '../../consumer/component/dependencies';
import componentIdToPackageName from '../../utils/bit/component-id-to-package-name';
import { BitId } from '../../bit-id';
import { DependenciesObjectDefinition } from './types';

// TODO: consider raname this class, it's not really a graph since it has only the first level
export class DependencyGraph {
  constructor(private component: Component) {}

  toJson(): DependenciesObjectDefinition {
    const consumerComponent: ConsumerComponent = this.component.state._consumer;

    return {
      devDependencies: {
        ...this.toPackageJson(this.component, consumerComponent.devDependencies),
        ...consumerComponent.packageDependencies,
      },
      dependencies: {
        ...this.toPackageJson(this.component, consumerComponent.dependencies),
        ...consumerComponent.devPackageDependencies,
      },
      peerDependencies: {
        ...consumerComponent.peerPackageDependencies,
      },
    };
  }

  private toPackageJson(component: Component, dependencies: Dependencies) {
    const newVersion = '0.0.1-new';
    return dependencies.getAllIds().reduce((acc, depId: BitId) => {
      if (!depId.hasVersion() || depId.version === '0.0.1') return acc;
      const packageDependency = depId.hasVersion() ? depId.version : newVersion;
      const packageName = componentIdToPackageName({
        ...component.state._consumer,
        id: depId,
        isDependency: true,
      });
      acc[packageName] = packageDependency;
      return acc;
    }, {});
  }
}