import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import {
  PAGE_METADATA_KEY,
  PAGE_ROOT_METADATA_KEY,
  PAGES_DIR_METADATA_KEY,
  validatePageFile,
} from "../common/page.decorator.js";

@Injectable()
export class PageValidatorService implements OnModuleInit {
  private readonly logger = new Logger("NIST:PageValidator");

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  async onModuleInit() {
    this.logger.log("🔍 Validating page components...");

    const controllers = this.discoveryService
      .getControllers()
      .filter((wrapper: InstanceWrapper) => wrapper.metatype);

    let validatedCount = 0;

    for (const wrapper of controllers) {
      const { metatype, instance } = wrapper;

      if (!instance || !metatype) continue;

      // Get page root from controller
      const pageRoot = this.reflector.get<string>(
        PAGE_ROOT_METADATA_KEY,
        metatype
      );
      const hasPagesDir = this.reflector.get<boolean>(
        PAGES_DIR_METADATA_KEY,
        metatype
      );

      if (!pageRoot) continue;

      // Scan all methods for @Page decorator
      const methodNames = this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance)
      );

      for (const methodName of methodNames) {
        const pageName = this.reflector.get<string>(
          PAGE_METADATA_KEY,
          instance[methodName]
        );

        if (pageName) {
          // Validate the page file exists
          await validatePageFile(pageRoot, pageName, hasPagesDir);
          validatedCount++;
        }
      }
    }

    this.logger.log(`✅ Validated ${validatedCount} page component(s)`);
  }
}
