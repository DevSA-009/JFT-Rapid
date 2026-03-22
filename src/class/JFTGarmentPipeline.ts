interface JFTGarmentPipelineParams {
  jftItemsCache: JFTItemCache;
  data: AutomateData;
}

type Workflow = {
  -readonly [key in keyof typeof PairObjectMarkers]: boolean;
};

type SizeRanges = { from: ApparelSize; to: ApparelSize }[];

interface GenerateLayoutDocParams {
  itemType: keyof JFTItemCache;
  orientation?: StackOrientation;
  sizeRanges?: null | SizeRanges;
  dataMultiply?: number;
}

interface HandleSizeRangeParams extends Omit<
  GenerateLayoutDocParams,
  "sizeRange"
> {
  readonly sizeRange: SizeRanges[0];
}

type TrackRangeSizeChar = Record<ApparelSize, ApparelSizeRange>;

class JFTGarmentPipeline {
  private readonly data: JFTGarmentPipelineParams["data"];

  private tempData: JFTGarmentPipelineParams["data"];

  private jftItemsCache: JFTGarmentPipelineParams["jftItemsCache"];

  private apparelSizesChar: ApparelSize[];

  private trackRangeSizeChar: TrackRangeSizeChar = {} as TrackRangeSizeChar;

  constructor(params: JFTGarmentPipelineParams) {
    this.jftItemsCache = params.jftItemsCache;
    this.data = params.data;
    this.apparelSizesChar = Object.keys(params.data.details) as ApparelSize[];
    this.tempData = Utils.deepCopy(this.data);
    this.run();
  }

  private run() {
    this.collarFlowHandle();
    this.ribFlowHandler();
    this.sleeveFlowHandle();
    this.bodyFlowHandle();
    // this.pantFlowHandle();
  }

  private handleFixedSizeItem(params: GenerateLayoutDocParams) {
    const { itemType, orientation = "auto", dataMultiply = 1 } = params;

    const jftItem = this.jftItemsCache[itemType];

    const fixedSizeChar = "L" as ApparelSize;
    const dimension = CONFIG.SIZES_DETAILS[fixedSizeChar][itemType];

    let mergedData: SizeMarkerEntries = [];

    const hasDync = jftItem.items[0].isDynamic || jftItem.items[1].isDynamic;

    if (hasDync) {
      for (const size of this.apparelSizesChar) {
        const sizeChar = size as ApparelSize;
        const details = this.tempData.details[sizeChar];
        const data = details.DATA;
        mergedData = Utils.deepCopy([...mergedData, ...data]);
      }
    }

    new GridLayoutGenerator({
      dimension,
      data: mergedData,
      sizeChar: fixedSizeChar,
      sizeTkn: "ALL",
      distributeGap: CONFIG.ITEMS_GAP,
      jftItem,
      orientation,
      quantity: this.tempData.basic.total * dataMultiply,
    });

    this.apparelSizesChar = [];
  }

  /**
   * Filters an array of sizes based on a given inclusive range.
   *
   * @param sizeRange - Object of size range values to filter.
   *
   * @returns A new array containing only sizes within the specified range.
   *
   * @throws Will throw if min or max is not a valid size.
   */
  private filterSizeRange(sizeRange: SizeRanges[0]): ApparelSize[] {
    const minValue = SIZE_ORDER_MAP[sizeRange!.from];
    const maxValue = SIZE_ORDER_MAP[sizeRange!.to];

    if (minValue === undefined || maxValue === undefined) {
      throw new Error("Invalid size range provided.");
    }

    return this.apparelSizesChar.filter((size) => {
      const value = SIZE_ORDER_MAP[size];
      return value >= minValue && value <= maxValue;
    });
  }

  private handleSizeRange(sizeRange: SizeRanges[0]) {
    const range = this.filterSizeRange(sizeRange);

    const { from, to } = sizeRange;

    const sizeChar = `${from}-${to}` as ApparelSizeRange;

    const details = this.tempData.details[sizeRange.to];

    for (const size of range) {
      const sizeType = size as ApparelSize;

      if (sizeType === sizeRange.to) {
        this.trackRangeSizeChar[sizeType] = sizeChar;
        continue;
      }

      const nestDetails = this.tempData.details[sizeType];

      for (const key in details.SUMMARY) {
        const keyType = key as keyof FlatSummary;
        details.SUMMARY[keyType] =
          details.SUMMARY[keyType] + nestDetails.SUMMARY[keyType];
      }

      details.DATA = Utils.deepCopy([...details.DATA, ...nestDetails.DATA]);

      const idx = this.apparelSizesChar.indexOf(sizeType);

      this.apparelSizesChar.splice(idx, 1);
    }
  }

  private generateLayoutDoc(params: GenerateLayoutDocParams) {
    const {
      itemType,
      orientation = "auto",
      sizeRanges = null,
      dataMultiply = 1,
    } = params;

    this.apparelSizesChar = Object.keys(this.data.details) as ApparelSize[];
    this.trackRangeSizeChar = {} as TrackRangeSizeChar;
    this.tempData = Utils.deepCopy(this.data);

    const jftItem = this.jftItemsCache[itemType];

    if (!jftItem) return;

    if (jftItem.info.fixedSize) {
      this.handleFixedSizeItem(params);
      return;
    }

    if (sizeRanges && CONFIG.DIMENSION_RANGE) {
      for (const range of sizeRanges) {
        this.handleSizeRange(range);
      }
    }

    if (!this.apparelSizesChar.length) return;

    const sortedSizes = Utils.sortSizes(this.apparelSizesChar);

    for (const size of sortedSizes) {
      const sizeChar = size as ApparelSize;
      const details = this.tempData.details[sizeChar];
      const data = details.DATA;
      if (!details.SUMMARY.BODY) continue;
      const sizeTkn = this.trackRangeSizeChar[sizeChar]
        ? this.trackRangeSizeChar[sizeChar]
        : sizeChar;
      const dimension = CONFIG.SIZES_DETAILS[sizeChar][itemType];
      const qty = details["SUMMARY"][itemType as keyof FlatSummary];
      new GridLayoutGenerator({
        dimension,
        data,
        sizeChar,
        distributeGap: CONFIG.ITEMS_GAP,
        sizeTkn,
        jftItem,
        orientation,
        quantity: qty * dataMultiply,
      });
    }
  }

  private collarFlowHandle() {
    if (this.data.basic.type === JerseyType.POLO) {
      this.generateLayoutDoc({
        itemType: "PLACKET",
      });
      this.generateLayoutDoc({
        itemType: "COLLAR",
      });
    } else {
      this.generateLayoutDoc({
        itemType: "NECK",
        orientation: "vertical",
      });
    }
  }

  private ribFlowHandler() {
    const ribInfo = this.data.basic.rib;

    if (ribInfo.type !== RIBType.NO) {
      if (ribInfo.apply.length >= 2) {
        (this.generateLayoutDoc({
          itemType: "SHORT_SLEEVE_RIB",
          dataMultiply: ribInfo.type === RIBType.CUFF ? 2 : 1,
          orientation: "vertical",
        }),
          this.generateLayoutDoc({
            itemType: "LONG_SLEEVE_RIB",
            orientation: "vertical",
          }));
      } else {
        const enumKey: keyof Workflow = `${ribInfo.apply[0]}_SLEEVE_RIB`;
        const dataMultiply =
          enumKey === "SHORT_SLEEVE_RIB" && ribInfo.type === RIBType.CUFF
            ? 2
            : 1;
        this.generateLayoutDoc({
          itemType: enumKey,
          dataMultiply,
          orientation: "vertical",
        });
      }
    }
  }

  private sleeveFlowHandle() {
    const slvInfo = this.data.basic.sleeve;

    const slvRange: SizeRanges = [
      { from: "XS", to: "S" },
      { from: "M", to: "L" },
      { from: "XL", to: "2XL" },
      { from: "3XL", to: "5XL" },
      { from: "2", to: "4" },
      { from: "6", to: "8" },
      { from: "10", to: "12" },
      { from: "14", to: "16" },
    ];

    if (slvInfo.length >= 2) {
      (this.generateLayoutDoc({
        itemType: "SHORT_SLEEVE",
        sizeRanges: slvRange,
      }),
        this.generateLayoutDoc({
          itemType: "LONG_SLEEVE",
          sizeRanges: slvRange,
        }));
    } else {
      const enumKey: keyof Workflow = `${slvInfo[0]}_SLEEVE`;

      this.generateLayoutDoc({
        itemType: enumKey,
      });
    }
  }

  private bodyFlowHandle() {
    this.generateLayoutDoc({ itemType: "BODY" });
  }

  private pantFlowHandle() {}
}
