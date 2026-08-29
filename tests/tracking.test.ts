import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent, TrackingEvent } from "../src/lib/tracking";

describe("trackEvent", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      (window as any).dataLayer = undefined;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should return early if window is undefined", () => {
    // Stub window as undefined
    vi.stubGlobal("window", undefined);

    // Should not throw
    expect(() => trackEvent(TrackingEvent.CtaClick)).not.toThrow();
  });

  it("should dispatch CustomEvent on window", () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    trackEvent(TrackingEvent.CtaClick, { button_name: "test" });

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const eventArg = dispatchEventSpy.mock.calls[0][0] as unknown as CustomEvent;
    expect(eventArg.type).toBe("hsb:tracking");
    expect(eventArg.detail).toEqual({
      event: TrackingEvent.CtaClick,
      payload: { button_name: "test" }
    });
  });

  it("should push to dataLayer if it is an array", () => {
    const dataLayer: unknown[] = [];
    (window as any).dataLayer = dataLayer;

    trackEvent(TrackingEvent.LeadFormSubmit, { step: 1 });

    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toEqual({
      event: TrackingEvent.LeadFormSubmit,
      step: 1
    });
  });

  it("should not crash if dataLayer is not an array", () => {
    (window as any).dataLayer = "not an array";

    expect(() => trackEvent(TrackingEvent.PhoneClick)).not.toThrow();
  });
});
