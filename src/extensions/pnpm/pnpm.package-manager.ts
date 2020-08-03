import { join } from 'path';
import { install } from './lynx';
import { PackageManager } from '../dependency-resolver/package-manager';
import { ComponentMap } from '../component/component-map';
import {
  DependencyResolverExtension,
  ComponentsManifestsMap,
  CreateFromComponentsOptions,
} from '../dependency-resolver';
import { PkgExtension } from '../pkg';
import { Logger } from '../logger';

const userHome = require('user-home');

export class PnpmPackageManager implements PackageManager {
  constructor(private depResolver: DependencyResolverExtension, private pkg: PkgExtension, private logger: Logger) {}

  async install(rootDir: string, componentDirectoryMap: ComponentMap<string>): Promise<void> {
    const storeDir: string = join(userHome, '.pnpm-store');
    const workspacePolicy = this.depResolver.getWorkspacePolicy() || {};
    const rootDepObject = {
      dependencies: {
        ...workspacePolicy.dependencies,
      },
      peerDependencies: {
        ...workspacePolicy.peerDependencies,
      },
    };

    const components = componentDirectoryMap.toArray().map(([component]) => component);
    const options: CreateFromComponentsOptions = {
      filterComponentsFromManifests: true,
      createManifestForComponentsWithoutDependencies: true,
    };
    const workspaceManifest = this.depResolver.getWorkspaceManifest(
      undefined,
      undefined,
      rootDepObject,
      rootDir,
      components,
      options
    );
    const rootManifest = workspaceManifest.toJson({ includeDir: true, copyPeerToRuntime: true });
    const componentsManifests = this.computeComponentsManifests(
      componentDirectoryMap,
      workspaceManifest.componentsManifestsMap
    );
    this.logger.setStatusLine('installing dependencies');
    await install(rootManifest, componentsManifests, storeDir);
    this.logger.consoleSuccess('installing dependencies');
  }

  private computeComponentsManifests(
    componentDirectoryMap: ComponentMap<string>,
    componentsManifestsFromWorkspace: ComponentsManifestsMap
  ) {
    return componentDirectoryMap.toArray().reduce((acc, [component, dir]) => {
      const packageName = this.pkg.getPackageName(component);
      if (componentsManifestsFromWorkspace.has(packageName)) {
        acc[dir] = componentsManifestsFromWorkspace.get(packageName)?.toJson();
      }
      return acc;
    }, {});
  }
}
