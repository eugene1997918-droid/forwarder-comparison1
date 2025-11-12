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
    { name: "인천북항",   oceanPort: "인천", inland20: 491000, inland40: 559000 },
    { name: "광양",       oceanPort: "광양", inland20: 550000, inland40: 630000 },
    { name: "부산북항",   oceanPort: "부산", inland20: 540000, inland40: 630000 },
    { name: "부산신항",   oceanPort: "부산", inland20: 540000, inland40: 656000 },
    { name: "평택",       oceanPort: "평택", inland20: 340000, inland40: 363000 },
  ]);

  // ------------ Lanes (Origin -> Destination) ------------
  const [lanes, setLanes] = useState([
    { id: "BUSAN>NS",      origin: "부산", dest: "인도 NS", name: "부산 → 인도 NS", transit: 16 },
    { id: "BUSAN>MUNDRA",  origin: "부산", dest: "문드라",  name: "부산 → 문드라",  transit: 18 },
    { id: "BUSAN>CALLAO",  origin: "부산", dest: "칼라오",  name: "부산 → 칼라오",  transit: 30 },
  ]);

  // ------------ Forwarders ------------
  const seedLaneRates = (laneList) => {
    const obj = {};
    laneList.forEach(l => { obj[l.id] = { "20ft": 0, "40ft": 0 }; });
    return obj;
  };

  const [forwarders, setForwarders] = useState([
    {
      name: "롯데",
      freetime: 21,
      laneRates: {
        ...seedLaneRates(lanes),
        "BUSAN>NS":     { "20ft": 890, "40ft": 1300 },
        "BUSAN>MUNDRA": { "20ft": 920, "40ft": 1350 },
        "BUSAN>CALLAO": { "20ft": 2100,"40ft": 3200 },
      },
    },
    {
      name: "H로지스",
      freetime: 21,
      laneRates: {
        ...seedLaneRates(lanes),
        "BUSAN>NS":     { "20ft": 950, "40ft": 1150 },
        "BUSAN>MUNDRA": { "20ft": 980, "40ft": 1250 },
        "BUSAN>CALLAO": { "20ft": 2050,"40ft": 3150 },
      },
    },
  ]);

  // ---- Add/Update/Delete Forwarder ----
  const [newForwarderName, setNewForwarderName] = useState("");
  const [newForwarderFreetime, setNewForwarderFreetime] = useState(21);

  const addForwarder = () => {
    if (!newForwarderName.trim()) return;
    setForwarders(prev => ([
      ...prev,
      {
        name: newForwarderName.trim(),
        freetime: Number.isFinite(+newForwarderFreetime) ? +newForwarderFreetime : 0,
        laneRates: seedLaneRates(lanes),
      },
    ]));
    setNewForwarderName("");
    setNewForwarderFreetime(21);
  };

  const deleteForwarder = (index) => {
    setForwarders(prev => prev.filter((_, i) => i !== index));
  };

  const updateForwarderFreetime = (fIndex, value) => {
    setForwarders(prev => prev.map((f, i) =>
      i === fIndex ? { ...f, freetime: parseInt(value, 10) || 0 } : f
    ));
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
    setPorts(prev => prev.map((p,i) =>
      i === index ? { ...p, [field]: field.includes("inland") ? (parseFloat(value)||0) : value } : p
    ));
  };
  const deletePort = (index) => setPorts(prev => prev.filter((_,i)=>i!==index));

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
      inland40: parseFloat(newPortInland40) || 0,
    }]);
    setNewPortName(""); setNewPortOcean(""); setNewPortInland20(0); setNewPortInland40(0);
  };

  // ---- Lanes CRUD ----
  const [laneOrigin, setLaneOrigin]   = useState("부산");
  const [laneDest, setLaneDest]       = useState("");
  const [laneName, setLaneName]       = useState("");
  const [laneTransit, setLaneTransit] = useState(20);

  const addLane = () => {
    if (!laneOrigin.trim() || !laneDest.trim()) return;
    const id = `${laneOrigin.toUpperCase()}>${laneDest.toUpperCase()}`.replace(/\s+/g,"");
    const name = laneName.trim() || `${laneOrigin} → ${laneDest}`;
    const newLane = { id, origin: laneOrigin.trim(), dest: laneDest.trim(), name, transit: parseInt(laneTransit,10)||0 };
    setLanes(prev => [...prev, newLane]);
    // 모든 포워더에 laneRates 키 추가
    setForwarders(prev => prev.map(f => ({
      ...f,
      laneRates: { ...(f.laneRates||{}), [id]: { "20ft": 0, "40ft": 0 } },
    })));
    setLaneDest(""); setLaneName(""); setLaneTransit(20);
  };

  const updateLane = (idx, field, value) => {
    setLanes(prev => prev.map((l,i) => i===idx ? { ...l, [field]: (field==="transit" ? (parseInt(value,10)||0) : value) } : l));
  };

  const deleteLane = (idx) => {
    const laneId = lanes[idx].id;
    setLanes(prev => prev.filter((_,i)=>i!==idx));
    // 각 포워더에서 해당 laneId 제거
    setForwarders(prev => prev.map(f => {
      const copy = { ...(f.laneRates||{}) };
      delete copy[laneId];
      return { ...f, laneRates: copy };
    }));
  };

  // ------------ Cost Logic ------------
  const calculateFreetimeCost = (f1, f2, laneId) => {
    const rate1 = f1.laneRates?.[laneId]?.[containerType] || 0;
    const rate2 = f2.laneRates?.[laneId]?.[containerType] || 0;
    const ft1 = Number(f1.freetime || 0);
    const ft2 = Number(f2.freetime || 0);
    if (rate1 === 0 || rate2 === 0 || ft1 === ft2) return 0;
    const perDay = Math.abs(rate1 - rate2) / Math.abs(ft1 - ft2 || 1);
    const excess = Math.max(0, actualDays - ft1);
    return excess * perDay;
  };

  const calculateTotalCost = (port, lane, forwarder) => {
    if (lane.origin !== port.oceanPort) return null;
    const oceanRate = forwarder.laneRates?.[lane.id]?.[containerType] || 0;
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
      dest: lane.dest,
    };
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
              ...cost,
            });
          }
        });
      });
    });
    return combos.sort((a,b)=>a.total-b.total);
  }, [ports, lanes, forwarders, containerType, quantity, exchangeRate, thc, docFee, actualDays]);

  const bestOption  = allCombinations[0];
  const worstOption = allCombinations[allCombinations.length-1];

  // ------------ 추가 계산: 목적지별 1위 ------------
  const destList = React.useMemo(() => {
    const set = new Set(lanes.map(l => l.dest));
    return Array.from(set);
  }, [lanes]);

  const bestByDest = React.useMemo(() => {
    const map = {};
    destList.forEach(d => (map[d] = null));
    allCombinations.forEach(c => {
      if (!map[c.dest] || c.total < map[c.dest].total) {
        map[c.dest] = c;
      }
    });
    return map;
  }, [allCombinations, destList]);

  // ------------ UI ------------
  const uniqueOrigins = Array.from(new Set(ports.map(p=>p.oceanPort)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded bg-indigo-100 text-indigo-600">🧮</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">포워더 분석</h1>
                <p className="text-gray-600">포트별 분석</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                editMode ? "bg-green-600 text-white" : "bg-indigo-600 text-white"
              }`}
            >
              <span>{editMode ? "💾 완료" : "✏️ 데이터 편집"}</span>
            </button>
          </div>
        </div>

        {/* Editors */}
        {editMode && (
          <div className="space-y-6">
            {/* Forwarder editor */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">💵 포워더 관리</h2>

              {forwarders.map((fw, fIndex) => (
                <div key={fIndex} className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-gray-800">{fw.name}</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">프리타임:</label>
                        <input
                          type="number"
                          value={fw.freetime}
                          onChange={(e)=>updateForwarderFreetime(fIndex, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm text-gray-600">일</span>
                      </div>
                    </div>
                    <button onClick={()=>deleteForwarder(fIndex)} className="text-red-500 hover:text-red-700">🗑️</button>
                  </div>

                  {/* Lane rates table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="py-2 px-2 text-left">루트</th>
                          <th className="py-2 px-2 text-left">Origin</th>
                          <th className="py-2 px-2 text-left">Dest</th>
                          <th className="py-2 px-2 text-right">20ft ($)</th>
                          <th className="py-2 px-2 text-right">40ft ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lanes.map(lane => (
                          <tr key={lane.id} className="border-b border-gray-100">
                            <td className="py-2 px-2">{lane.name}</td>
                            <td className="py-2 px-2">{lane.origin}</td>
                            <td className="py-2 px-2">{lane.dest}</td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={fw.laneRates?.[lane.id]?.["20ft"] ?? 0}
                                onChange={(e)=>updateForwarderLaneRate(fIndex, lane.id, "20ft", e.target.value)}
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                value={fw.laneRates?.[lane.id]?.["40ft"] ?? 0}
                                onChange={(e)=>updateForwarderLaneRate(fIndex, lane.id, "40ft", e.target.value)}
                                className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Add forwarder */}
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">새 포워더 추가</h4>
                <div className="flex gap-3 flex-wrap">
                  <input className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg" placeholder="포워더 이름"
                    value={newForwarderName} onChange={e=>setNewForwarderName(e.target.value)} />
                  <input className="w-32 px-3 py-2 border rounded-lg" type="number" placeholder="프리타임(일)"
                    value={newForwarderFreetime} onChange={e=>setNewForwarderFreetime(parseInt(e.target.value)||0)} />
                  <button onClick={addForwarder} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">➕ 추가</button>
                </div>
              </div>
            </div>

            {/* Lanes editor */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">🧭 루트 관리 (Origin → Destination)</h2>

              <div className="space-y-3">
                {lanes.map((lane, idx) => (
                  <div key={lane.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg flex-wrap">
                    <input className="w-40 px-3 py-2 border rounded-lg" value={lane.origin}
                      onChange={(e)=>updateLane(idx,"origin",e.target.value)} placeholder="Origin(예: 부산)" />
                    <input className="w-48 px-3 py-2 border rounded-lg" value={lane.dest}
                      onChange={(e)=>updateLane(idx,"dest",e.target.value)} placeholder="Destination(예: 문드라)" />
                    <input className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg" value={lane.name}
                      onChange={(e)=>updateLane(idx,"name",e.target.value)} placeholder="표시명(예: 부산 → 문드라)" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Transit</span>
                      <input className="w-24 px-3 py-2 border rounded-lg" type="number" value={lane.transit}
                        onChange={(e)=>updateLane(idx,"transit",e.target.value)} />
                      <span className="text-sm text-gray-600">일</span>
                    </div>
                    <button onClick={()=>deleteLane(idx)} className="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                ))}
              </div>

              {/* Add lane */}
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">새 루트 추가</h4>
                <div className="flex gap-3 flex-wrap">
                  <select className="w-40 px-3 py-2 border rounded-lg"
                    value={laneOrigin}
                    onChange={(e)=>setLaneOrigin(e.target.value)}>
                    {uniqueOrigins.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <input className="w-48 px-3 py-2 border rounded-lg" placeholder="Destination(예: 칼라오)"
                    value={laneDest} onChange={e=>setLaneDest(e.target.value)} />
                  <input className="flex-1 min-w-[220px] px-3 py-2 border rounded-lg" placeholder="표시명(예: 부산 → 칼라오)"
                    value={laneName} onChange={e=>setLaneName(e.target.value)} />
                  <input className="w-28 px-3 py-2 border rounded-lg" type="number" placeholder="Transit(일)"
                    value={laneTransit} onChange={e=>setLaneTransit(parseInt(e.target.value)||0)} />
                  <button onClick={addLane} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">➕ 추가</button>
                </div>
              </div>
            </div>

            {/* Ports editor */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">🚛 항구 및 내륙운송비 관리</h2>
              <div className="space-y-3">
                {ports.map((p, idx)=>(
                  <div key={idx} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg flex-wrap">
                    <input className="flex-1 min-w-[180px] px-3 py-2 border rounded-lg" value={p.name} onChange={e=>updatePort(idx,"name",e.target.value)} placeholder="항구명"/>
                    <input className="w-32 px-3 py-2 border rounded-lg" value={p.oceanPort} onChange={e=>updatePort(idx,"oceanPort",e.target.value)} placeholder="해상항구"/>
                    <input className="w-40 px-3 py-2 border rounded-lg" type="number" value={p.inland20} onChange={e=>updatePort(idx,"inland20",e.target.value)} placeholder="20ft 내륙비"/>
                    <input className="w-40 px-3 py-2 border rounded-lg" type="number" value={p.inland40} onChange={e=>updatePort(idx,"inland40",e.target.value)} placeholder="40ft 내륙비"/>
                    <button onClick={()=>deletePort(idx)} className="text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">새 항구 추가</h4>
                <div className="flex gap-3 flex-wrap">
                  <input className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg" placeholder="항구명 (예: 부산신항)"
                    value={newPortName} onChange={e=>setNewPortName(e.target.value)} />
                  <input className="w-40 px-3 py-2 border rounded-lg" placeholder="해상항구 (예: 부산)"
                    value={newPortOcean} onChange={e=>setNewPortOcean(e.target.value)} />
                  <input className="w-40 px-3 py-2 border rounded-lg" type="number" placeholder="20ft 내륙비"
                    value={newPortInland20} onChange={e=>setNewPortInland20(parseFloat(e.target.value)||0)} />
                  <input className="w-40 px-3 py-2 border rounded-lg" type="number" placeholder="40ft 내륙비"
                    value={newPortInland40} onChange={e=>setNewPortInland40(parseFloat(e.target.value)||0)} />
                  <button onClick={addPort} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">➕ 추가</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conditions + Results */}
        {!editMode && (
          <>
            {/* 조건 입력 (간단 버전: THC/DOC/프리타임 섹션 제거) */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">조건 입력</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">컨테이너 타입</label>
                  <select
                    value={containerType}
                    onChange={e=>setContainerType(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option>20ft</option>
                    <option>40ft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">수량 (개)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e=>setQuantity(Math.max(1, parseInt(e.target.value)||1))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">환율 (₩/$)</label>
                  <input
                    type="number"
                    min="1"
                    value={exchangeRate}
                    onChange={e=>setExchangeRate(Math.max(1, parseFloat(e.target.value)||1300))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 목적지(카테고리)별 1위 카드 */}
            {destList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {destList.map(dest => {
                  const o = bestByDest[dest];
                  if (!o) return null;
                  return (
                    <div
                      key={dest}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg p-6 text-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 flex items-center justify-center rounded bg-white/20">🏆</div>
                            <h2 className="text-2xl font-bold">{dest} 최적 선택</h2>
                          </div>

                          <p className="text-sm opacity-90 mb-2">
                            {o.origin} · {o.laneName} · {o.forwarder}
                          </p>

                          <div className="flex items-baseline gap-3">
                            <span className="text-4xl md:text-5xl font-bold">
                              {fmtKRW(o.total)}
                            </span>
                            <span className="text-lg opacity-90">총 비용</span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm opacity-90">
                            <div>
                              <p className="font-semibold">내륙운송</p>
                              <p>₩{Math.round(o.inland).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-semibold">해상운임 (환산)</p>
                              <p>₩{Math.round(o.totalUSD * exchangeRate).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Transit</p>
                              <p>{o.transit}일</p>
                            </div>
                            <div>
                              <p className="font-semibold">프리타임 비용(추정)</p>
                              <p>${Math.round(o.freetimeCost)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center opacity-80">📉</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* === 카테고리별 순위 (문드라 / NS / 칼라오) === */}
            {[
              { label: "인도 문드라", dest: "문드라" },
              { label: "인도 NS", dest: "인도 NS" },
              { label: "부산 칼라오", dest: "칼라오" },
            ].map(group => {
              const rows = allCombinations
                .filter(c => c.dest === group.dest)
                .sort((a, b) => a.total - b.total);

              const hasTwo = rows.length >= 2;
              const delta12 = hasTwo ? Math.round(rows[1].total - rows[0].total) : 0;

              return (
                <div key={group.dest} className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {group.label} — 카테고리 순위
                    </h2>

                    <div className="text-sm">
                      {rows.length === 0 && <span className="text-gray-500">데이터 없음</span>}
                      {rows.length === 1 && <span className="text-gray-700">1위만 존재 (비교 불가)</span>}
                      {hasTwo && (
                        <span className="font-medium text-green-700">
                          1위가 2위보다{" "}
                          <span className="text-green-600 font-semibold">
                            ₩{delta12.toLocaleString()}
                          </span>{" "}
                          저렴
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="py-3 px-4 text-center font-bold text-gray-700">순위</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700">인랜드항</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700">루트</th>
                          <th className="py-3 px-4 text-left font-bold text-gray-700">포워더</th>
                          <th className="py-3 px-4 text-right font-bold text-gray-700">내륙운송</th>
                          <th className="py-3 px-4 text-right font-bold text-gray-700">해상운임</th>
                          <th className="py-3 px-4 text-right font-bold text-gray-700">Transit</th>
                          <th className="py-3 px-4 text-right font-bold text-indigo-600">총 비용</th>
                          <th className="py-3 px-4 text-right font-bold text-green-600">1위 대비</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c, idx) => {
                          const diff = idx === 0 ? 0 : Math.round(c.total - rows[0].total);
                          return (
                            <tr
                              key={`${group.dest}-${idx}-${c.portName}-${c.forwarder}-${c.laneName}`}
                              className={`border-b border-gray-100 hover:bg-gray-50 ${idx === 0 ? "bg-green-50 font-semibold" : ""}`}
                            >
                              <td className="py-3 px-4 text-center">
                                {idx === 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full font-bold">1</span>
                                ) : (
                                  <span className="text-gray-600">{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-800">{c.portName}</td>
                              <td className="py-3 px-4 text-gray-800">{c.laneName}</td>
                              <td className="py-3 px-4 text-gray-800">{c.forwarder}</td>
                              <td className="py-3 px-4 text-right text-gray-600">₩{Math.round(c.inland).toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                ${c.ocean} (₩{Math.round(c.ocean * exchangeRate).toLocaleString()})
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">{c.transit}일</td>
                              <td className="py-3 px-4 text-right text-gray-600">{fmtKRW(c.inland)}
</td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {idx === 0 ? "-" : `+₩${diff.toLocaleString()}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
// ---- format helpers ----
const fmtKRW = n => `₩${Math.round(n).toLocaleString()}`;
const fmtUSD = n => `$${Math.round(n).toLocaleString()}`;

// 이름으로 포워더 찾기
const getForwarder = (name) => forwarders.find(f => f.name === name);
root.render(<ForwarderComparison />);
