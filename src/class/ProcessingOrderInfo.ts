class ProcessingOrder {
  constructor(params: ProcessingOrder) {
    const { hamType, jersyType, rib, slvType } = params;
  }

  private jerseyTypeHandle(type: JerseyType) {}
}

interface ProcessingOrder {
  jersyType: keyof typeof JerseyType;
  slvType: keyof typeof SleeveType;
  hamType: keyof typeof HamType;
  rib: keyof typeof JerseyType;
}
