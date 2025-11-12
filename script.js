// CodePen: JS Preprocessor = Babel, React/ReactDOM via CDN, (optional) Tailwind via CDN
const { useState, useMemo } = React;

function ForwarderComparison() {
  // ------------ Controls ------------
  const [containerType, setContainerType] = useState("20ft");
  const [quantity, setQuantity] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(1300);

  // 전역 기본값(현재 UI는 없음; 필요하면 편집 화면에 per-forwarder 필드로 확장 가능)
  const [thc, setThc] = useState(0);
  const [docFee, setDocFee] = useState(0);
  const [actualDays, setActualDays] = useState(21);

  const [editMode, setEditMode] = useState(false);

  // ------------ Ports (픽업/인랜드) ------------
  const [ports, setPorts] = useState([
  { name: "인천신규항", oceanPort: "인천", inland20: 473000, inland40: 538000 },
  { name: "인천북항", oceanPort: "인천", inland20: 491000, inland40: 559000 },
  { name: "광양", oceanPort: "광양", inland20: 550000, inland40: 630000 },
  { name: "부산북항", oceanPort: "부산", inland20: 540000, inland40: 630000 },
  { name: "부산신항", oceanPort: "부산", inland20: 540000, inland40: 656000 },
  { name: "평택", oceanPort: "평택", inland20: 340000, inland40: 363000 }]);


  // ------------ Lanes (Origin -> Destination) ------------
  const [lanes, setLanes] = useState([
  { id: "BUSAN>NS", origin: "부산", dest: "인도 NS", name: "부산 → 인도 NS", transit: 16 },
  { id: "BUSAN>MUNDRA", origin: "부산", dest: "문드라", name: "부산 → 문드라", transit: 18 },
  { id: "BUSAN>CALLAO", origin: "부산", dest: "칼라오", name: "부산 → 칼라오", transit: 30 }]);


  // ------------ Forwarders ------------
  const seedLaneRates = laneList => {
    const obj = {};
    laneList.forEach(l => {obj[l.id] = { "20ft": 0, "40ft": 0 };});
    return obj;
  };

  const [forwarders, setForwarders] = useState([
  {
    name: "롯데",
    freetime: 21,
    laneRates: {
      ...seedLaneRates(lanes),
      "BUSAN>NS": { "20ft": 890, "40ft": 1300 },
      "BUSAN>MUNDRA": { "20ft": 920, "40ft": 1350 },
      "BUSAN>CALLAO": { "20ft": 2100, "40ft": 3200 } } },


  {
    name: "H로지스",
    freetime: 21,
    laneRates: {
      ...seedLaneRates(lanes),
      "BUSAN>NS": { "20ft": 950, "40ft": 1150 },
      "BUSAN>MUNDRA": { "20ft": 980, "40ft": 1250 },
      "BUSAN>CALLAO": { "20ft": 2050, "40ft": 3150 } } }]);




  // ---- Add/Update/Delete Forwarder ----
  const [newForwarderName, setNewForwarderName] = useState("");
  const [newForwarderFreetime, setNewForwarderFreetime] = useState(21);

  const addForwarder = () => {
    if (!newForwarderName.trim()) return;
    setForwarders(prev => [
    ...prev,
    {
      name: newForwarderName.trim(),
      freetime: Number.isFinite(+newForwarderFreetime) ? +newForwarderFreetime : 0,
      laneRates: seedLaneRates(lanes) }]);


    setNewForwarderName("");
    setNewForwarderFreetime(21);
  };

  const deleteForwarder = index => {
    setForwarders(prev => prev.filter((_, i) => i !== index));
  };

  const updateForwarderFreetime = (fIndex, value) => {
    setForwarders(prev => prev.map((f, i) =>
    i === fIndex ? { ...f, freetime: parseInt(value, 10) || 0 } : f));

  };

  const updateForwarderLaneRate = (fIndex, laneId, type, value) => {
    setForwarders(prev => prev.map((f, i) => {
      if (i !== fIndex) return f;
      const lr = { ...(f.laneRates || {}) };
      lr[laneId] = { ...(lr[laneId] || { "20ft": 0, "40ft": 0 }), [type]: parseFloat(value) || 0 };
      return { ...f, laneRates: lr };
    }));
  };

  // ---- Ports CRUD ----
  const updatePort = (index, field, value) => {
    setPorts(prev => prev.map((p, i) =>
    i === index ? { ...p, [field]: field.includes("inland") ? parseFloat(value) || 0 : value } : p));

  };
  const deletePort = index => setPorts(prev => prev.filter((_, i) => i !== index));

  const [newPortName, setNewPortName] = useState("");
  const [newPortOcean, setNewPortOcean] = useState("");
  const [newPortInland20, setNewPortInland20] = useState(0);
  const [newPortInland40, setNewPortInland40] = useState(0);
  const addPort = () => {
    if (!newPortName.trim() || !newPortOcean.trim()) return;
    setPorts(prev => [...prev, {
      name: newPortName.trim(),
      oceanPort: newPortOcean.trim(),
      inland20: parseFloat(newPortInland20) || 0,
      inland40: parseFloat(newPortInland40) || 0 }]);

    setNewPortName("");setNewPortOcean("");setNewPortInland20(0);setNewPortInland40(0);
  };

  // ---- Lanes CRUD ----
  const [laneOrigin, setLaneOrigin] = useState("부산");
  const [laneDest, setLaneDest] = useState("");
  const [laneName, setLaneName] = useState("");
  const [laneTransit, setLaneTransit] = useState(20);

  const addLane = () => {
    if (!laneOrigin.trim() || !laneDest.trim()) return;
    const id = `${laneOrigin.toUpperCase()}>${laneDest.toUpperCase()}`.replace(/\s+/g, "");
    const name = laneName.trim() || `${laneOrigin} → ${laneDest}`;
    const newLane = { id, origin: laneOrigin.trim(), dest: laneDest.trim(), name, transit: parseInt(laneTransit, 10) || 0 };
    setLanes(prev => [...prev, newLane]);
    // 모든 포워더에 laneRates 키 추가
    setForwarders(prev => prev.map(f => ({
      ...f,
      laneRates: { ...(f.laneRates || {}), [id]: { "20ft": 0, "40ft": 0 } } })));

    setLaneDest("");setLaneName("");setLaneTransit(20);
  };

  const updateLane = (idx, field, value) => {
    setLanes(prev => prev.map((l, i) => i === idx ? { ...l, [field]: field === "transit" ? parseInt(value, 10) || 0 : value } : l));
  };

  const deleteLane = idx => {
    const laneId = lanes[idx].id;
    setLanes(prev => prev.filter((_, i) => i !== idx));
    // 각 포워더에서 해당 laneId 제거
    setForwarders(prev => prev.map(f => {
      const copy = { ...(f.laneRates || {}) };
      delete copy[laneId];
      return { ...f, laneRates: copy };
    }));
  };

  // ------------ Cost Logic ------------
  const calculateFreetimeCost = (f1, f2, laneId) => {var _f1$laneRates, _f1$laneRates$laneId, _f2$laneRates, _f2$laneRates$laneId;
    const rate1 = ((_f1$laneRates = f1.laneRates) === null || _f1$laneRates === void 0 ? void 0 : (_f1$laneRates$laneId = _f1$laneRates[laneId]) === null || _f1$laneRates$laneId === void 0 ? void 0 : _f1$laneRates$laneId[containerType]) || 0;
    const rate2 = ((_f2$laneRates = f2.laneRates) === null || _f2$laneRates === void 0 ? void 0 : (_f2$laneRates$laneId = _f2$laneRates[laneId]) === null || _f2$laneRates$laneId === void 0 ? void 0 : _f2$laneRates$laneId[containerType]) || 0;
    const ft1 = Number(f1.freetime || 0);
    const ft2 = Number(f2.freetime || 0);
    if (rate1 === 0 || rate2 === 0 || ft1 === ft2) return 0;
    const perDay = Math.abs(rate1 - rate2) / Math.abs(ft1 - ft2 || 1);
    const excess = Math.max(0, actualDays - ft1);
    return excess * perDay;
  };

  const calculateTotalCost = (port, lane, forwarder) => {var _forwarder$laneRates, _forwarder$laneRates$;
    if (lane.origin !== port.oceanPort) return null;
    const oceanRate = ((_forwarder$laneRates = forwarder.laneRates) === null || _forwarder$laneRates === void 0 ? void 0 : (_forwarder$laneRates$ = _forwarder$laneRates[lane.id]) === null || _forwarder$laneRates$ === void 0 ? void 0 : _forwarder$laneRates$[containerType]) || 0;
    if (!oceanRate) return null;

    const inlandCost = containerType === "20ft" ? port.inland20 : port.inland40;

    let freetimeCost = 0;
    forwarders.forEach(other => {
      if (other.name !== forwarder.name) {
        freetimeCost = Math.max(freetimeCost, calculateFreetimeCost(forwarder, other, lane.id));
      }
    });

    const totalUSD = oceanRate + thc + docFee + freetimeCost;
    const oceanCostKRW = totalUSD * exchangeRate;
    const totalPerUnit = inlandCost + oceanCostKRW;

    return {
      inland: inlandCost,
      ocean: oceanRate,
      freetimeCost,
      totalUSD,
      totalPerUnit,
      total: totalPerUnit * quantity,
      laneName: lane.name,
      transit: lane.transit,
      dest: lane.dest };

  };

  const allCombinations = useMemo(() => {
    const combos = [];
    ports.forEach(port => {
      lanes.forEach(lane => {
        forwarders.forEach(fw => {
          const cost = calculateTotalCost(port, lane, fw);
          if (cost) {
            combos.push({
              portName: port.name,
              origin: port.oceanPort,
              forwarder: fw.name,
              ...cost });

          }
        });
      });
    });
    return combos.sort((a, b) => a.total - b.total);
  }, [ports, lanes, forwarders, containerType, quantity, exchangeRate, thc, docFee, actualDays]);

  const bestOption = allCombinations[0];
  const worstOption = allCombinations[allCombinations.length - 1];

  // ------------ 추가 계산: 목적지별 1위 ------------
  const destList = React.useMemo(() => {
    const set = new Set(lanes.map(l => l.dest));
    return Array.from(set);
  }, [lanes]);

  const bestByDest = React.useMemo(() => {
    const map = {};
    destList.forEach(d => map[d] = null);
    allCombinations.forEach(c => {
      if (!map[c.dest] || c.total < map[c.dest].total) {
        map[c.dest] = c;
      }
    });
    return map;
  }, [allCombinations, destList]);

  // ------------ UI ------------
  const uniqueOrigins = Array.from(new Set(ports.map(p => p.oceanPort)));

  return /*#__PURE__*/(
    React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" }, /*#__PURE__*/
    React.createElement("div", { className: "max-w-7xl mx-auto space-y-6" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-6" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 flex items-center justify-center rounded bg-indigo-100 text-indigo-600" }, "\uD83E\uDDEE"), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h1", { className: "text-3xl font-bold text-gray-800" }, "\uD3EC\uC6CC\uB354 \uBD84\uC11D"), /*#__PURE__*/
    React.createElement("p", { className: "text-gray-600" }, "\uD3EC\uD2B8\uBCC4 \uBD84\uC11D"))), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => setEditMode(!editMode),
      className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      editMode ? "bg-green-600 text-white" : "bg-indigo-600 text-white"
      }` }, /*#__PURE__*/

    React.createElement("span", null, editMode ? "💾 완료" : "✏️ 데이터 편집")))),





    editMode && /*#__PURE__*/
    React.createElement("div", { className: "space-y-6" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-6" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" }, "\uD83D\uDCB5 \uD3EC\uC6CC\uB354 \uAD00\uB9AC"),

    forwarders.map((fw, fIndex) => /*#__PURE__*/
    React.createElement("div", { key: fIndex, className: "mb-8 p-4 bg-gray-50 rounded-lg" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-4" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-lg font-bold text-gray-800" }, fw.name), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("label", { className: "text-sm text-gray-600" }, "\uD504\uB9AC\uD0C0\uC784:"), /*#__PURE__*/
    React.createElement("input", {
      type: "number",
      value: fw.freetime,
      onChange: e => updateForwarderFreetime(fIndex, e.target.value),
      className: "w-20 px-2 py-1 border border-gray-300 rounded text-sm" }), /*#__PURE__*/

    React.createElement("span", { className: "text-sm text-gray-600" }, "\uC77C"))), /*#__PURE__*/


    React.createElement("button", { onClick: () => deleteForwarder(fIndex), className: "text-red-500 hover:text-red-700" }, "\uD83D\uDDD1\uFE0F")), /*#__PURE__*/



    React.createElement("div", { className: "overflow-x-auto" }, /*#__PURE__*/
    React.createElement("table", { className: "w-full text-sm" }, /*#__PURE__*/
    React.createElement("thead", null, /*#__PURE__*/
    React.createElement("tr", { className: "border-b-2 border-gray-200" }, /*#__PURE__*/
    React.createElement("th", { className: "py-2 px-2 text-left" }, "\uB8E8\uD2B8"), /*#__PURE__*/
    React.createElement("th", { className: "py-2 px-2 text-left" }, "Origin"), /*#__PURE__*/
    React.createElement("th", { className: "py-2 px-2 text-left" }, "Dest"), /*#__PURE__*/
    React.createElement("th", { className: "py-2 px-2 text-right" }, "20ft ($)"), /*#__PURE__*/
    React.createElement("th", { className: "py-2 px-2 text-right" }, "40ft ($)"))), /*#__PURE__*/


    React.createElement("tbody", null,
    lanes.map(lane => {var _fw$laneRates$lane$id, _fw$laneRates, _fw$laneRates$lane$id2, _fw$laneRates$lane$id3, _fw$laneRates2, _fw$laneRates2$lane$i;return /*#__PURE__*/(
        React.createElement("tr", { key: lane.id, className: "border-b border-gray-100" }, /*#__PURE__*/
        React.createElement("td", { className: "py-2 px-2" }, lane.name), /*#__PURE__*/
        React.createElement("td", { className: "py-2 px-2" }, lane.origin), /*#__PURE__*/
        React.createElement("td", { className: "py-2 px-2" }, lane.dest), /*#__PURE__*/
        React.createElement("td", { className: "py-2 px-2 text-right" }, /*#__PURE__*/
        React.createElement("input", {
          type: "number",
          value: (_fw$laneRates$lane$id = (_fw$laneRates = fw.laneRates) === null || _fw$laneRates === void 0 ? void 0 : (_fw$laneRates$lane$id2 = _fw$laneRates[lane.id]) === null || _fw$laneRates$lane$id2 === void 0 ? void 0 : _fw$laneRates$lane$id2["20ft"]) !== null && _fw$laneRates$lane$id !== void 0 ? _fw$laneRates$lane$id : 0,
          onChange: e => updateForwarderLaneRate(fIndex, lane.id, "20ft", e.target.value),
          className: "w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right" })), /*#__PURE__*/


        React.createElement("td", { className: "py-2 px-2 text-right" }, /*#__PURE__*/
        React.createElement("input", {
          type: "number",
          value: (_fw$laneRates$lane$id3 = (_fw$laneRates2 = fw.laneRates) === null || _fw$laneRates2 === void 0 ? void 0 : (_fw$laneRates2$lane$i = _fw$laneRates2[lane.id]) === null || _fw$laneRates2$lane$i === void 0 ? void 0 : _fw$laneRates2$lane$i["40ft"]) !== null && _fw$laneRates$lane$id3 !== void 0 ? _fw$laneRates$lane$id3 : 0,
          onChange: e => updateForwarderLaneRate(fIndex, lane.id, "40ft", e.target.value),
          className: "w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right" }))));})))))), /*#__PURE__*/











    React.createElement("div", { className: "mt-4 p-4 bg-indigo-50 rounded-lg" }, /*#__PURE__*/
    React.createElement("h4", { className: "font-semibold text-gray-800 mb-3" }, "\uC0C8 \uD3EC\uC6CC\uB354 \uCD94\uAC00"), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 flex-wrap" }, /*#__PURE__*/
    React.createElement("input", { className: "flex-1 min-w-[200px] px-3 py-2 border rounded-lg", placeholder: "\uD3EC\uC6CC\uB354 \uC774\uB984",
      value: newForwarderName, onChange: e => setNewForwarderName(e.target.value) }), /*#__PURE__*/
    React.createElement("input", { className: "w-32 px-3 py-2 border rounded-lg", type: "number", placeholder: "\uD504\uB9AC\uD0C0\uC784(\uC77C)",
      value: newForwarderFreetime, onChange: e => setNewForwarderFreetime(parseInt(e.target.value) || 0) }), /*#__PURE__*/
    React.createElement("button", { onClick: addForwarder, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg" }, "\u2795 \uCD94\uAC00")))), /*#__PURE__*/





    React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-6" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" }, "\uD83E\uDDED \uB8E8\uD2B8 \uAD00\uB9AC (Origin \u2192 Destination)"), /*#__PURE__*/

    React.createElement("div", { className: "space-y-3" },
    lanes.map((lane, idx) => /*#__PURE__*/
    React.createElement("div", { key: lane.id, className: "flex gap-3 items-center p-3 bg-gray-50 rounded-lg flex-wrap" }, /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", value: lane.origin,
      onChange: e => updateLane(idx, "origin", e.target.value), placeholder: "Origin(\uC608: \uBD80\uC0B0)" }), /*#__PURE__*/
    React.createElement("input", { className: "w-48 px-3 py-2 border rounded-lg", value: lane.dest,
      onChange: e => updateLane(idx, "dest", e.target.value), placeholder: "Destination(\uC608: \uBB38\uB4DC\uB77C)" }), /*#__PURE__*/
    React.createElement("input", { className: "flex-1 min-w-[200px] px-3 py-2 border rounded-lg", value: lane.name,
      onChange: e => updateLane(idx, "name", e.target.value), placeholder: "\uD45C\uC2DC\uBA85(\uC608: \uBD80\uC0B0 \u2192 \uBB38\uB4DC\uB77C)" }), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-sm text-gray-600" }, "Transit"), /*#__PURE__*/
    React.createElement("input", { className: "w-24 px-3 py-2 border rounded-lg", type: "number", value: lane.transit,
      onChange: e => updateLane(idx, "transit", e.target.value) }), /*#__PURE__*/
    React.createElement("span", { className: "text-sm text-gray-600" }, "\uC77C")), /*#__PURE__*/

    React.createElement("button", { onClick: () => deleteLane(idx), className: "text-red-500 hover:text-red-700" }, "\uD83D\uDDD1\uFE0F")))), /*#__PURE__*/





    React.createElement("div", { className: "mt-4 p-4 bg-indigo-50 rounded-lg" }, /*#__PURE__*/
    React.createElement("h4", { className: "font-semibold text-gray-800 mb-3" }, "\uC0C8 \uB8E8\uD2B8 \uCD94\uAC00"), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 flex-wrap" }, /*#__PURE__*/
    React.createElement("select", { className: "w-40 px-3 py-2 border rounded-lg",
      value: laneOrigin,
      onChange: e => setLaneOrigin(e.target.value) },
    uniqueOrigins.map(o => /*#__PURE__*/React.createElement("option", { key: o }, o))), /*#__PURE__*/

    React.createElement("input", { className: "w-48 px-3 py-2 border rounded-lg", placeholder: "Destination(\uC608: \uCE7C\uB77C\uC624)",
      value: laneDest, onChange: e => setLaneDest(e.target.value) }), /*#__PURE__*/
    React.createElement("input", { className: "flex-1 min-w-[220px] px-3 py-2 border rounded-lg", placeholder: "\uD45C\uC2DC\uBA85(\uC608: \uBD80\uC0B0 \u2192 \uCE7C\uB77C\uC624)",
      value: laneName, onChange: e => setLaneName(e.target.value) }), /*#__PURE__*/
    React.createElement("input", { className: "w-28 px-3 py-2 border rounded-lg", type: "number", placeholder: "Transit(\uC77C)",
      value: laneTransit, onChange: e => setLaneTransit(parseInt(e.target.value) || 0) }), /*#__PURE__*/
    React.createElement("button", { onClick: addLane, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg" }, "\u2795 \uCD94\uAC00")))), /*#__PURE__*/





    React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-6" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" }, "\uD83D\uDE9B \uD56D\uAD6C \uBC0F \uB0B4\uB959\uC6B4\uC1A1\uBE44 \uAD00\uB9AC"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-3" },
    ports.map((p, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, className: "flex gap-3 items-center p-3 bg-gray-50 rounded-lg flex-wrap" }, /*#__PURE__*/
    React.createElement("input", { className: "flex-1 min-w-[180px] px-3 py-2 border rounded-lg", value: p.name, onChange: e => updatePort(idx, "name", e.target.value), placeholder: "\uD56D\uAD6C\uBA85" }), /*#__PURE__*/
    React.createElement("input", { className: "w-32 px-3 py-2 border rounded-lg", value: p.oceanPort, onChange: e => updatePort(idx, "oceanPort", e.target.value), placeholder: "\uD574\uC0C1\uD56D\uAD6C" }), /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", type: "number", value: p.inland20, onChange: e => updatePort(idx, "inland20", e.target.value), placeholder: "20ft \uB0B4\uB959\uBE44" }), /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", type: "number", value: p.inland40, onChange: e => updatePort(idx, "inland40", e.target.value), placeholder: "40ft \uB0B4\uB959\uBE44" }), /*#__PURE__*/
    React.createElement("button", { onClick: () => deletePort(idx), className: "text-red-500 hover:text-red-700" }, "\uD83D\uDDD1\uFE0F")))), /*#__PURE__*/




    React.createElement("div", { className: "mt-4 p-4 bg-indigo-50 rounded-lg" }, /*#__PURE__*/
    React.createElement("h4", { className: "font-semibold text-gray-800 mb-3" }, "\uC0C8 \uD56D\uAD6C \uCD94\uAC00"), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 flex-wrap" }, /*#__PURE__*/
    React.createElement("input", { className: "flex-1 min-w-[200px] px-3 py-2 border rounded-lg", placeholder: "\uD56D\uAD6C\uBA85 (\uC608: \uBD80\uC0B0\uC2E0\uD56D)",
      value: newPortName, onChange: e => setNewPortName(e.target.value) }), /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", placeholder: "\uD574\uC0C1\uD56D\uAD6C (\uC608: \uBD80\uC0B0)",
      value: newPortOcean, onChange: e => setNewPortOcean(e.target.value) }), /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", type: "number", placeholder: "20ft \uB0B4\uB959\uBE44",
      value: newPortInland20, onChange: e => setNewPortInland20(parseFloat(e.target.value) || 0) }), /*#__PURE__*/
    React.createElement("input", { className: "w-40 px-3 py-2 border rounded-lg", type: "number", placeholder: "40ft \uB0B4\uB959\uBE44",
      value: newPortInland40, onChange: e => setNewPortInland40(parseFloat(e.target.value) || 0) }), /*#__PURE__*/
    React.createElement("button", { onClick: addPort, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg" }, "\u2795 \uCD94\uAC00"))))),







    !editMode && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-xl shadow-lg p-6" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-xl font-bold text-gray-800 mb-4" }, "\uC870\uAC74 \uC785\uB825"), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-2" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "\uCEE8\uD14C\uC774\uB108 \uD0C0\uC785"), /*#__PURE__*/
    React.createElement("select", {
      value: containerType,
      onChange: e => setContainerType(e.target.value),
      className: "w-full p-3 border rounded-lg" }, /*#__PURE__*/

    React.createElement("option", null, "20ft"), /*#__PURE__*/
    React.createElement("option", null, "40ft"))), /*#__PURE__*/



    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "\uC218\uB7C9 (\uAC1C)"), /*#__PURE__*/
    React.createElement("input", {
      type: "number",
      min: "1",
      value: quantity,
      onChange: e => setQuantity(Math.max(1, parseInt(e.target.value) || 1)),
      className: "w-full p-3 border rounded-lg" })), /*#__PURE__*/



    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "\uD658\uC728 (\u20A9/$)"), /*#__PURE__*/
    React.createElement("input", {
      type: "number",
      min: "1",
      value: exchangeRate,
      onChange: e => setExchangeRate(Math.max(1, parseFloat(e.target.value) || 1300)),
      className: "w-full p-3 border rounded-lg" })))),






    destList.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
    destList.map(dest => {
      const o = bestByDest[dest];
      if (!o) return null;
      return /*#__PURE__*/(
        React.createElement("div", {
          key: dest,
          className: "bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg p-6 text-white" }, /*#__PURE__*/

        React.createElement("div", { className: "flex items-start justify-between" }, /*#__PURE__*/
        React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /*#__PURE__*/
        React.createElement("div", { className: "w-8 h-8 flex items-center justify-center rounded bg-white/20" }, "\uD83C\uDFC6"), /*#__PURE__*/
        React.createElement("h2", { className: "text-2xl font-bold" }, dest, " \uCD5C\uC801 \uC120\uD0DD")), /*#__PURE__*/


        React.createElement("p", { className: "text-sm opacity-90 mb-2" },
        o.origin, " \xB7 ", o.laneName, " \xB7 ", o.forwarder), /*#__PURE__*/


        React.createElement("div", { className: "flex items-baseline gap-3" }, /*#__PURE__*/
        React.createElement("span", { className: "text-4xl md:text-5xl font-bold" },
        fmtKRW(o.total)), /*#__PURE__*/

        React.createElement("span", { className: "text-lg opacity-90" }, "\uCD1D \uBE44\uC6A9")), /*#__PURE__*/


        React.createElement("div", { className: "mt-4 grid grid-cols-2 gap-4 text-sm opacity-90" }, /*#__PURE__*/
        React.createElement("div", null, /*#__PURE__*/
        React.createElement("p", { className: "font-semibold" }, "\uB0B4\uB959\uC6B4\uC1A1"), /*#__PURE__*/
        React.createElement("p", null, "\u20A9", Math.round(o.inland).toLocaleString())), /*#__PURE__*/

        React.createElement("div", null, /*#__PURE__*/
        React.createElement("p", { className: "font-semibold" }, "\uD574\uC0C1\uC6B4\uC784 (\uD658\uC0B0)"), /*#__PURE__*/
        React.createElement("p", null, "\u20A9", Math.round(o.totalUSD * exchangeRate).toLocaleString())), /*#__PURE__*/

        React.createElement("div", null, /*#__PURE__*/
        React.createElement("p", { className: "font-semibold" }, "Transit"), /*#__PURE__*/
        React.createElement("p", null, o.transit, "\uC77C")), /*#__PURE__*/

        React.createElement("div", null, /*#__PURE__*/
        React.createElement("p", { className: "font-semibold" }, "\uD504\uB9AC\uD0C0\uC784 \uBE44\uC6A9(\uCD94\uC815)"), /*#__PURE__*/
        React.createElement("p", null, "$", Math.round(o.freetimeCost))))), /*#__PURE__*/



        React.createElement("div", { className: "w-10 h-10 flex items-center justify-center opacity-80" }, "\uD83D\uDCC9"))));



    })),




    [
    { label: "인도 문드라", dest: "문드라" },
    { label: "인도 NS", dest: "인도 NS" },
    { label: "부산 칼라오", dest: "칼라오" }].
    map(group => {
      const rows = allCombinations.
      filter(c => c.dest === group.dest).
      sort((a, b) => a.total - b.total);

      const hasTwo = rows.length >= 2;
      const delta12 = hasTwo ? Math.round(rows[1].total - rows[0].total) : 0;

      return /*#__PURE__*/(
        React.createElement("div", { key: group.dest, className: "bg-white rounded-xl shadow-lg p-6 mb-6" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center justify-between mb-4" }, /*#__PURE__*/
        React.createElement("h2", { className: "text-xl font-bold text-gray-800" },
        group.label, " \u2014 \uCE74\uD14C\uACE0\uB9AC \uC21C\uC704"), /*#__PURE__*/


        React.createElement("div", { className: "text-sm" },
        rows.length === 0 && /*#__PURE__*/React.createElement("span", { className: "text-gray-500" }, "\uB370\uC774\uD130 \uC5C6\uC74C"),
        rows.length === 1 && /*#__PURE__*/React.createElement("span", { className: "text-gray-700" }, "1\uC704\uB9CC \uC874\uC7AC (\uBE44\uAD50 \uBD88\uAC00)"),
        hasTwo && /*#__PURE__*/
        React.createElement("span", { className: "font-medium text-green-700" }, "1\uC704\uAC00 2\uC704\uBCF4\uB2E4",
        " ", /*#__PURE__*/
        React.createElement("span", { className: "text-green-600 font-semibold" }, "\u20A9",
        delta12.toLocaleString()),
        " ", "\uC800\uB834"))), /*#__PURE__*/






        React.createElement("div", { className: "overflow-x-auto" }, /*#__PURE__*/
        React.createElement("table", { className: "w-full" }, /*#__PURE__*/
        React.createElement("thead", null, /*#__PURE__*/
        React.createElement("tr", { className: "border-b-2 border-gray-200" }, /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-center font-bold text-gray-700" }, "\uC21C\uC704"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-left font-bold text-gray-700" }, "\uC778\uB79C\uB4DC\uD56D"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-left font-bold text-gray-700" }, "\uB8E8\uD2B8"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-left font-bold text-gray-700" }, "\uD3EC\uC6CC\uB354"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-right font-bold text-gray-700" }, "\uB0B4\uB959\uC6B4\uC1A1"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-right font-bold text-gray-700" }, "\uD574\uC0C1\uC6B4\uC784"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-right font-bold text-gray-700" }, "Transit"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-right font-bold text-indigo-600" }, "\uCD1D \uBE44\uC6A9"), /*#__PURE__*/
        React.createElement("th", { className: "py-3 px-4 text-right font-bold text-green-600" }, "1\uC704 \uB300\uBE44"))), /*#__PURE__*/


        React.createElement("tbody", null,
        rows.map((c, idx) => {
          const diff = idx === 0 ? 0 : Math.round(c.total - rows[0].total);
          return /*#__PURE__*/(
            React.createElement("tr", {
              key: `${group.dest}-${idx}-${c.portName}-${c.forwarder}-${c.laneName}`,
              className: `border-b border-gray-100 hover:bg-gray-50 ${idx === 0 ? "bg-green-50 font-semibold" : ""}` }, /*#__PURE__*/

            React.createElement("td", { className: "py-3 px-4 text-center" },
            idx === 0 ? /*#__PURE__*/
            React.createElement("span", { className: "inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full font-bold" }, "1") : /*#__PURE__*/

            React.createElement("span", { className: "text-gray-600" }, idx + 1)), /*#__PURE__*/


            React.createElement("td", { className: "py-3 px-4 text-gray-800" }, c.portName), /*#__PURE__*/
            React.createElement("td", { className: "py-3 px-4 text-gray-800" }, c.laneName), /*#__PURE__*/
            React.createElement("td", { className: "py-3 px-4 text-gray-800" }, c.forwarder), /*#__PURE__*/
            React.createElement("td", { className: "py-3 px-4 text-right text-gray-600" }, "\u20A9", Math.round(c.inland).toLocaleString()), /*#__PURE__*/
            React.createElement("td", { className: "py-3 px-4 text-right text-gray-600" }, "$",
            c.ocean, " (\u20A9", Math.round(c.ocean * exchangeRate).toLocaleString(), ")"), /*#__PURE__*/

            React.createElement("td", { className: "py-3 px-4 text-right text-gray-600" }, c.transit, "\uC77C"), /*#__PURE__*/
            React.createElement("td", { className: "py-3 px-4 text-right text-gray-600" }, fmtKRW(c.inland)), /*#__PURE__*/

            React.createElement("td", { className: "py-3 px-4 text-right text-gray-600" },
            idx === 0 ? "-" : `+₩${diff.toLocaleString()}`)));



        }))))));





    })))));





}

const root = ReactDOM.createRoot(document.getElementById("root"));
// ---- format helpers ----
const fmtKRW = n => `₩${Math.round(n).toLocaleString()}`;
const fmtUSD = n => `$${Math.round(n).toLocaleString()}`;

// 이름으로 포워더 찾기
const getForwarder = name => forwarders.find(f => f.name === name);
root.render( /*#__PURE__*/React.createElement(ForwarderComparison, null));