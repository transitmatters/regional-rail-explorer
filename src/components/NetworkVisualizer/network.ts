import {
    line as anyLine,
    start,
    curve as anyCurve,
    RoutePatternDescriptor,
    prerenderRoutePatterns,
} from "diagrams";

export const prerenderNetwork = (curveRadius = 10) => {
    const line = (length) => anyLine(Math.max(length - curveRadius, 20));
    const curve = (angle) => anyCurve(curveRadius, angle);
    const cw = curve(45);
    const ccw = curve(-45);

    const southStation = start(0, 20, 90);
    const northStation = start(0, -0, -90);

    const toBeverly = [northStation, line(20), cw, line(20), cw, line(40), ccw, line(100)] as const;
    const toBackBay = [southStation, line(10), curve(90), line(25)] as const;
    const toForestHills = [...toBackBay, ccw, line(40)] as const;
    const toCanton = [...toForestHills, line(10), ccw, line(90)] as const;
    const toQuincyCenter = [southStation, line(50), ccw, line(60)] as const;
    const toBraintree = [...toQuincyCenter, cw, line(20)] as const;
    const toPlymouthKingstonSplit = [...toBraintree, ccw, line(120), ccw, line(20)] as const;
    const toMiddleborough = [...toBraintree, line(100), curve(90), line(10), curve(-90)] as const;

    const rockport: RoutePatternDescriptor = {
        shape: [...toBeverly, line(100)],
        stationIds: [],
    };

    const newburyport: RoutePatternDescriptor = {
        shape: [...toBeverly, ccw, line(50), ccw, line(40)],
        stationIds: [],
    };

    const haverhill: RoutePatternDescriptor = {
        shape: [northStation, line(170), cw, line(50)],
        stationIds: [],
    };

    const lowell: RoutePatternDescriptor = {
        shape: [northStation, line(10), ccw, line(70), cw, line(80), ccw, line(50)],
        stationIds: [],
    };

    const fitchburg: RoutePatternDescriptor = {
        shape: [northStation, line(10), curve(-90), line(130), cw, line(170)],
        stationIds: [],
    };

    const fairmount: RoutePatternDescriptor = {
        shape: [southStation, line(15), cw, line(80)],
        stationIds: [],
    };

    const franklin: RoutePatternDescriptor = {
        shape: [...fairmount.shape, line(240)],
        stationIds: [],
    };

    const needham: RoutePatternDescriptor = {
        shape: [...toForestHills, cw, line(80), curve(90), line(20)],
        stationIds: [],
    };

    const worcester: RoutePatternDescriptor = {
        shape: [...toBackBay, cw, line(35), ccw, line(200)],
        stationIds: [],
    };

    const providence: RoutePatternDescriptor = {
        shape: [...toCanton, line(70), cw, line(40)],
        stationIds: [],
    };

    const stoughton: RoutePatternDescriptor = {
        shape: [...toCanton, ccw, line(50)],
        stationIds: [],
    };

    const newbedford: RoutePatternDescriptor = {
        shape: [...toMiddleborough, line(40)],
        stationIds: [],
    };

    const fallriver: RoutePatternDescriptor = {
        shape: [...toMiddleborough, cw, line(35)],
        stationIds: [],
    };

    const plymouth: RoutePatternDescriptor = {
        shape: [...toPlymouthKingstonSplit, line(40)],
        stationIds: [],
    };

    const kingston: RoutePatternDescriptor = {
        shape: [...toPlymouthKingstonSplit, cw, line(30)],
        stationIds: [],
    };

    const greenbush: RoutePatternDescriptor = {
        shape: [...toQuincyCenter, ccw, line(90), cw, line(30)],
        stationIds: [],
    };

    return prerenderRoutePatterns({
        rockport,
        newburyport,
        haverhill,
        fairmount,
        franklin,
        needham,
        worcester,
        providence,
        stoughton,
        newbedford,
        fallriver,
        plymouth,
        kingston,
        greenbush,
        lowell,
        fitchburg,
    });
};
