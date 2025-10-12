"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { adminService } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

function DashboardAdmin() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()  
  console.log("Current User:", user)

  // Fetch dashboard data from backend using the service
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminService.getDashboardStats()
        console.log("Dashboard Data Response:", response)
        if (response.success) {
          setDashboardData(response.data)
        } else {
          throw new Error("Failed to fetch dashboard data")
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching dashboard data")
        console.error("Error fetching dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des données...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  const { statsData, userDistData, pfeTypesData, pfeStatusData, optionsData, periodes } = dashboardData

  // Check if PFE types data exists and has values
  const shouldShowPfeTypes = pfeTypesData && pfeTypesData.length > 0 && pfeTypesData.some((item) => item.value > 0)

  // Updated custom cursor component with alternating colors
  const CustomCursor = (props) => {
    const { x, y, width, height, payload } = props
    
    // Get the index of the current bar to determine color
    const dataIndex = payload && payload.length > 0 ? optionsData.findIndex(item => item.name === payload[0].payload.name) : 0
    const isBlue = dataIndex % 2 === 0
    
    const fillColor = isBlue ? "rgba(59, 130, 246, 0.08)" : "rgba(251, 146, 60, 0.08)"
    const strokeColor = isBlue ? "rgba(59, 130, 246, 0.2)" : "rgba(251, 146, 60, 0.2)"
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="4 4"
        rx={8}
        ry={8}
      />
    )
  }

  const StatCard = ({ title, value, colorClass, icon }) => (
    <div
      className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm tracking-wide uppercase opacity-90 mb-2">{title}</h3>
          <p className="text-white text-3xl font-bold mb-1">{value}</p>
        </div>
        <div className="text-white text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-sm text-gray-600">{`Pourcentage : ${payload[0].value}%`}</p>
        </div>
      )
    }
    return null
  }

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{capitalizeFirstLetter(payload[0].name)}</p>
          <p className="text-sm text-gray-600">{`Valeur : ${payload[0].value}%`}</p>
        </div>
      )
    }
    return null
  }

  const CustomTooltipMain = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-700">{entry.name}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: entry.color }}>
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Function to get color for PFE status based on status name
  const getPfeStatusColor = (statusName, index) => {
    const name = statusName.toLowerCase()
    if (name.includes('accepted') || name.includes('accepté') || name.includes('approve')) {
      return "#10b981" // Green for accepted
    } else if (name.includes('pending') || name.includes('en attente') || name.includes('waiting')) {
      return "#f59e0b" // Orange for pending
    } else if (name.includes('rejected') || name.includes('rejeté') || name.includes('refuse')) {
      return "#ef4444" // Red for rejected
    }
    // Fallback to original color array if status doesn't match known patterns
    return ["#10b981", "#f59e0b", "#ef4444"][index % 3]
  }

  const COLORS = {
    userDist: ["#3b82f6", "#f59e0b", "#10b981"],
    pfeTypes: ["#8b5cf6", "#f97316", "#06b6d4"],
  }

  const ChartCard = ({ title, children, className = "" }) => (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${className}`}
    >
      <h3 className="font-semibold text-gray-900 text-lg mb-4 text-center tracking-wide">{title}</h3>
      {children}
    </div>
  )

  const dashboardContent = (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Administrateur</h1>
          <p className="text-gray-600">Vue d'ensemble des statistiques et données système</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Étudiants" value={statsData.etudiants} colorClass="from-blue-500 to-blue-600" icon="👨‍🎓" />
          <StatCard
            title="Enseignants"
            value={statsData.enseignants}
            colorClass="from-amber-500 to-amber-600"
            icon="👨‍🏫"
          />
          <StatCard
            title="Entreprises"
            value={statsData.entreprises}
            colorClass="from-emerald-500 to-emerald-600"
            icon="🏢"
          />
        </div>

        {/* Charts Grid */}
        <div
          className={`grid gap-6 mb-8 ${shouldShowPfeTypes ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}
        >
          <ChartCard title="📊 Distribution des Utilisateurs">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={userDistData} cx="50%" cy="50%" outerRadius={80} paddingAngle={5} dataKey="value">
                  {userDistData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.userDist[index % COLORS.userDist.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                  }}
                  iconType="circle"
                  layout="horizontal"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="📈 État des Propositions">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pfeStatusData} cx="50%" cy="50%" outerRadius={80} paddingAngle={5} dataKey="value">
                  {pfeStatusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPfeStatusColor(entry.name, index)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: "10px",
                    fontSize: "14px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                  }}
                  iconType="circle"
                  layout="horizontal"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {shouldShowPfeTypes && (
            <ChartCard title="🎯 Types de PFE">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pfeTypesData?.map((item) => ({
                      ...item,
                      name: capitalizeFirstLetter(item.name),
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pfeTypesData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.pfeTypes[index % COLORS.pfeTypes.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: "10px",
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "15px"
                    }}
                    iconType="circle"
                    layout="horizontal"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Main Bar Chart with Custom Hover Behavior */}
        {optionsData && optionsData.length > 0 && (
          <ChartCard title="🎓 Répartition par Option" className="col-span-full">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={optionsData} barSize={45} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#666" }} height={40} axisLine={{ stroke: "#ddd" }} />
                <YAxis tick={{ fontSize: 12, fill: "#666" }} axisLine={{ stroke: "#ddd" }} />
                {/* Custom Tooltip with alternating cursor colors */}
                <Tooltip content={<CustomTooltipMain />} cursor={<CustomCursor />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                />
                <Bar dataKey="etudiants" name="Nombre Etudiants" fill="url(#blueGradientMain)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pfe" name="PFE proposés" fill="url(#orangeGradientMain)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="blueGradientMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="orangeGradientMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )

  return dashboardContent
}

export default DashboardAdmin