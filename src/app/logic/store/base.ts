//========================================================================
//
//  Interfaces
//
//========================================================================

type StatePartial<T> = Partial<Omit<T, 'id'>> & { id: string }

//========================================================================
//
//  Exports
//
//========================================================================

export { StatePartial }
