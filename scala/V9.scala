//> using scala "3"
//> using dep "com.lihaoyi::upickle:4.4.3"
//> using dep "org.xerial:sqlite-jdbc:3.53.4.0"

import scala.io.Source
import java.sql.{Connection, DriverManager}
import java.time.LocalDate
import java.time.format.DateTimeParseException

import scala.concurrent.{Future, Await}
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global


// ============================================================
// 1. DATA MODELS
// ============================================================

case class CMEEvent(
    activityID: String,
    startTime: String,
    sourceLocation: String,
    speed: Int,
    halfAngle: Int,
    cmeType: String,
    latitude: Double,
    longitude: Double,
    linkedEvents: String, // JSON string
    enlilArrival: String,
    isEarthGB: Boolean
)

case class SolarFlareEvent(
    flareID: String,
    beginTime: String,
    peakTime: String,
    classType: String,
    sourceLocation: String
)

case class GeomagneticStorm(
    stormID: String,
    startTime: String,
    maxKpIndex: Double
)

case class SEPEvent(
    sepID: String,
    eventTime: String,
    instrument: String,
    linkedCME: String
)

case class IPSEvent(
    ipsID: String,
    eventTime: String,
    location: String,
    catalog: String,
    instrument: String,
    linkedEvents: String
)

case class MPCEvent(
    mpcID: String,
    eventTime: String,
    instrument: String,
    linkedEvents: String // JSON string of linked activityIDs
)

case class RBEEvent(
    rbeID: String,
    eventTime: String,
    instrument: String,
    linkedEvents: String
)

case class HSSEvent(
    hssID: String,
    eventTime: String,
    instrument: String,
    linkedEvents: String
)

case class WSAEnlilEvent(
    simulationID: String,
    modelCompletionTime: String,
    estimatedShockArrivalTime: String,
    isEarthGB: Boolean,
    rmin_re: String,
    kp90: Int,
    kp135: Int,
    kp180: Int,
    cmeID: String,
    latitude: Double,
    longitude: Double,
    speed: Int,
    halfAngle: Int
)


// ============================================================
// 2. COMMON NASA API FUNCTION
// ============================================================

def getNASAData(url: String): ujson.Value = {

    val connection =
        new java.net.URL(url).openConnection()

    connection.setConnectTimeout(15000)
    connection.setReadTimeout(60000)

    val stream = connection.getInputStream()

    val source = Source.fromInputStream(stream)

    try {

        val jsonText = source.mkString

        ujson.read(jsonText)

    } finally {

        source.close()
        stream.close()
    }
}


// ============================================================
// 3. FETCH CME EVENTS
// ============================================================

def fetchCME(
    startDate: String,
    endDate: String
): List[CMEEvent] = {

    val url =
        s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate=$startDate&endDate=$endDate"

    println("Fetching CME data...")

    val json = getNASAData(url)

    val events =
        json.arr.flatMap { cme =>

            val analyses =
                cme("cmeAnalyses")

            if (
                analyses != ujson.Null &&
                analyses.arr.nonEmpty
            ) {

                // Find the analysis marked as most accurate
                val mostAccurate =
                    analyses.arr.find { analysis =>

                        analysis.obj
                            .get("isMostAccurate")
                            .exists {

                                case ujson.Bool(true) =>
                                    true

                                case _ =>
                                    false
                            }
                    }

                // If none is marked most accurate,
                // use the first available analysis
                val selectedAnalysis =
                    mostAccurate.getOrElse(
                        analyses.arr.head
                    )


                val sourceLocation =
                    if (cme("sourceLocation") == ujson.Null)
                        "Unknown"
                    else
                        cme("sourceLocation").str


                val cmeType =
                    if (selectedAnalysis("type") == ujson.Null)
                        "Unknown"
                    else
                        selectedAnalysis("type").str

                val latitude =
                    if (selectedAnalysis.obj.get("latitude").exists(_ != ujson.Null)) selectedAnalysis("latitude").num
                    else 0.0

                val longitude =
                    if (selectedAnalysis.obj.get("longitude").exists(_ != ujson.Null)) selectedAnalysis("longitude").num
                    else 0.0

                val linkedEvents =
                    if (cme.obj.get("linkedEvents").exists(_ != ujson.Null) && cme("linkedEvents").arr.nonEmpty)
                        cme("linkedEvents").arr.map(_("activityID").str).mkString(",")
                    else ""

                // Extract WSA-ENLIL Earth arrival prediction if present
                val (enlilArrival, isEarthGB) = {
                    if (selectedAnalysis.obj.get("enlilList").exists(_ != ujson.Null) && selectedAnalysis("enlilList").arr.nonEmpty) {
                        val earth = selectedAnalysis("enlilList").arr.find(_.obj.get("isEarthGB").exists {
                            case ujson.Bool(b) => b
                            case _ => false
                        }).getOrElse(selectedAnalysis("enlilList").arr.head)
                        val arr = if (earth.obj.get("estimatedShockArrivalTime").exists(_ != ujson.Null)) earth("estimatedShockArrivalTime").str else ""
                        val gb = earth.obj.get("isEarthGB").exists {
                            case ujson.Bool(b) => b
                            case _ => false
                        }
                        (arr, gb)
                    } else ("", false)
                }


                Some(
                    CMEEvent(
                        activityID =
                            cme("activityID").str,

                        startTime =
                            cme("startTime").str,

                        sourceLocation =
                            sourceLocation,

                        speed =
                            selectedAnalysis("speed")
                                .num
                                .toInt,

                        halfAngle =
                            selectedAnalysis("halfAngle")
                                .num
                                .toInt,

                        cmeType =
                            cmeType,

                        latitude = latitude,

                        longitude = longitude,

                        linkedEvents = linkedEvents,

                        enlilArrival = enlilArrival,

                        isEarthGB = isEarthGB
                    )
                )

            } else {

                None
            }

        }.toList


    println(
        s"CME events processed: ${events.size}"
    )

    events
}


// ============================================================
// 4. FETCH SOLAR FLARE EVENTS
// ============================================================

def fetchSolarFlares(
    startDate: String,
    endDate: String
): List[SolarFlareEvent] = {

    val url =
        s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=$startDate&endDate=$endDate"

    println("Fetching Solar Flare data...")

    val json =
        getNASAData(url)


    val events =
        json.arr.map { flare =>

            val peakTime =
                if (flare("peakTime") == ujson.Null)
                    "Unknown"
                else
                    flare("peakTime").str


            val classType =
                if (flare("classType") == ujson.Null)
                    "Unknown"
                else
                    flare("classType").str


            val sourceLocation =
                if (flare("sourceLocation") == ujson.Null)
                    "Unknown"
                else
                    flare("sourceLocation").str


            SolarFlareEvent(

                flareID =
                    flare("flrID").str,

                beginTime =
                    flare("beginTime").str,

                peakTime =
                    peakTime,

                classType =
                    classType,

                sourceLocation =
                    sourceLocation
            )

        }.toList


    println(
        s"Solar Flare events processed: ${events.size}"
    )

    events
}


// ============================================================
// 5. FETCH GEOMAGNETIC STORM EVENTS
// ============================================================

def fetchStorms(
    startDate: String,
    endDate: String
): List[GeomagneticStorm] = {

    val url =
        s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST?startDate=$startDate&endDate=$endDate"

    println("Fetching Geomagnetic Storm data...")

    val json =
        getNASAData(url)


    val events =
        json.arr.map { storm =>

            val kpIndexes =
                storm("allKpIndex")


            val maxKp =
                if (
                    kpIndexes != ujson.Null &&
                    kpIndexes.arr.nonEmpty
                ) {

                    kpIndexes.arr
                        .map(_("kpIndex").num)
                        .max

                } else {

                    0.0
                }


            GeomagneticStorm(

                stormID =
                    storm("gstID").str,

                startTime =
                    storm("startTime").str,

                maxKpIndex =
                    maxKp
            )

        }.toList


    println(
        s"Geomagnetic Storms processed: ${events.size}"
    )

    events
}


// ============================================================
// 5B. FETCH SEP EVENTS
// ============================================================

def fetchSEP(
    startDate: String,
    endDate: String
): List[SEPEvent] = {

    val url =
        s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=$startDate&endDate=$endDate"

    println("Fetching SEP data...")

    val json = getNASAData(url)

    val events =
        json.arr.map { sep =>

            val instrument =
                if (sep.obj.get("instruments").exists(_ != ujson.Null) && sep("instruments").arr.nonEmpty)
                    sep("instruments").arr.head.obj.get("displayName").map(_.str).getOrElse("Unknown")
                else
                    "Unknown"

            val linkedCME =
                if (sep.obj.get("linkedEvents").exists(_ != ujson.Null) && sep("linkedEvents").arr.nonEmpty)
                    sep("linkedEvents").arr.head.obj.get("activityID").map(_.str).getOrElse("")
                else
                    ""

            SEPEvent(
                sepID = sep("sepID").str,
                eventTime = sep("eventTime").str,
                instrument = instrument,
                linkedCME = linkedCME
            )

        }.toList

    println(s"SEP events processed: ${events.size}")

    events
}


// ============================================================
// 5C. FETCH IPS EVENTS
// ============================================================

def fetchIPS(
    startDate: String,
    endDate: String
): List[IPSEvent] = {

    val url =
        s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/IPS?startDate=$startDate&endDate=$endDate"

    println("Fetching IPS data...")

    val json = getNASAData(url)

    val events =
        json.arr.map { ips =>

            val location =
                if (ips.obj.get("location").exists(_ != ujson.Null))
                    ips("location").str
                else
                    "Unknown"

            val catalog =
                if (ips.obj.get("catalog").exists(_ != ujson.Null))
                    ips("catalog").str
                else
                    "Unknown"

            val instrument =
                if (ips.obj.get("instruments").exists(_ != ujson.Null) && ips("instruments").arr.nonEmpty)
                    ips("instruments").arr.head.obj.get("displayName").map(_.str).getOrElse("Unknown")
                else
                    "Unknown"

            val linkedEvents =
                if (ips.obj.get("linkedEvents").exists(_ != ujson.Null) && ips("linkedEvents").arr.nonEmpty)
                    ips("linkedEvents").arr.map(_("activityID").str).mkString(",")
                else ""

            IPSEvent(
                ipsID = ips("activityID").str,
                eventTime = ips("eventTime").str,
                location = location,
                catalog = catalog,
                instrument = instrument,
                linkedEvents = linkedEvents
            )

        }.toList

    println(s"IPS events processed: ${events.size}")

    events
}

def fetchMPC(
    startDate: String,
    endDate: String
): List[MPCEvent] = {
    val url = s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/MPC?startDate=$startDate&endDate=$endDate"
    println("Fetching MPC data...")
    val json = getNASAData(url)
    val events = json.arr.map { mpc =>
        val instrument = if (mpc.obj.get("instruments").exists(_ != ujson.Null) && mpc("instruments").arr.nonEmpty)
            mpc("instruments").arr.head.obj.get("displayName").map(_.str).getOrElse("Unknown") else "Unknown"
        val linked = if (mpc.obj.get("linkedEvents").exists(_ != ujson.Null) && mpc("linkedEvents").arr.nonEmpty)
            mpc("linkedEvents").arr.map(_("activityID").str).mkString(",") else ""
        MPCEvent(mpcID = mpc("mpcID").str, eventTime = mpc("eventTime").str, instrument = instrument, linkedEvents = linked)
    }.toList
    println(s"MPC events processed: ${events.size}")
    events
}

def fetchRBE(
    startDate: String,
    endDate: String
): List[RBEEvent] = {
    val url = s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/RBE?startDate=$startDate&endDate=$endDate"
    println("Fetching RBE data...")
    val json = getNASAData(url)
    val events = json.arr.map { rbe =>
        val instrument = if (rbe.obj.get("instruments").exists(_ != ujson.Null) && rbe("instruments").arr.nonEmpty)
            rbe("instruments").arr.head.obj.get("displayName").map(_.str).getOrElse("Unknown") else "Unknown"
        val linked = if (rbe.obj.get("linkedEvents").exists(_ != ujson.Null) && rbe("linkedEvents").arr.nonEmpty)
            rbe("linkedEvents").arr.map(_("activityID").str).mkString(",") else ""
        RBEEvent(rbeID = rbe("rbeID").str, eventTime = rbe("eventTime").str, instrument = instrument, linkedEvents = linked)
    }.toList
    println(s"RBE events processed: ${events.size}")
    events
}

def fetchHSS(
    startDate: String,
    endDate: String
): List[HSSEvent] = {
    val url = s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/HSS?startDate=$startDate&endDate=$endDate"
    println("Fetching HSS data...")
    val json = getNASAData(url)
    val events = json.arr.map { hss =>
        val instrument = if (hss.obj.get("instruments").exists(_ != ujson.Null) && hss("instruments").arr.nonEmpty)
            hss("instruments").arr.map(_("displayName").str).mkString(", ") else "Unknown"
        val linked = if (hss.obj.get("linkedEvents").exists(_ != ujson.Null) && hss("linkedEvents").arr.nonEmpty)
            hss("linkedEvents").arr.map(_("activityID").str).mkString(",") else ""
        HSSEvent(hssID = hss("hssID").str, eventTime = hss("eventTime").str, instrument = instrument, linkedEvents = linked)
    }.toList
    println(s"HSS events processed: ${events.size}")
    events
}

def fetchWSAEnlil(
    startDate: String,
    endDate: String
): List[WSAEnlilEvent] = {
    val url = s"https://ccmc.gsfc.nasa.gov/DONKI-API/get/WSAEnlilSimulations?startDate=$startDate&endDate=$endDate"
    println("Fetching WSA-Enlil data...")
    val json = getNASAData(url)
    val events = json.arr.flatMap { sim =>
        val simID = sim("simulationID").str
        val modelTime = if (sim.obj.get("modelCompletionTime").exists(_ != ujson.Null)) sim("modelCompletionTime").str else ""
        val estArrival = if (sim.obj.get("estimatedShockArrivalTime").exists(_ != ujson.Null)) sim("estimatedShockArrivalTime").str else ""
        val isEarthGB = sim.obj.get("isEarthGB").exists {
            case ujson.Bool(b) => b
            case _ => false
        }
        val rmin = if (sim.obj.get("rmin_re").exists(_ != ujson.Null)) sim("rmin_re").num.toString else ""
        val kp90 = if (sim.obj.get("kp_90").exists(_ != ujson.Null)) sim("kp_90").num.toInt else 0
        val kp135 = if (sim.obj.get("kp_135").exists(_ != ujson.Null)) sim("kp_135").num.toInt else 0
        val kp180 = if (sim.obj.get("kp_180").exists(_ != ujson.Null)) sim("kp_180").num.toInt else 0
        val inputs = if (sim.obj.get("cmeInputs").exists(_ != ujson.Null)) sim("cmeInputs").arr else ujson.Arr()
        if (inputs.arr.isEmpty) {
            List(WSAEnlilEvent(simID, modelTime, estArrival, isEarthGB, rmin, kp90, kp135, kp180, "", 0.0, 0.0, 0, 0))
        } else {
            inputs.arr.map { inp =>
                val lat = if (inp.obj.get("latitude").exists(_ != ujson.Null)) inp("latitude").num else 0.0
                val lon = if (inp.obj.get("longitude").exists(_ != ujson.Null)) inp("longitude").num else 0.0
                val spd = if (inp.obj.get("speed").exists(_ != ujson.Null)) inp("speed").num.toInt else 0
                val ha = if (inp.obj.get("halfAngle").exists(_ != ujson.Null)) inp("halfAngle").num.toInt else 0
                val cmeid = if (inp.obj.get("cmeid").exists(_ != ujson.Null)) inp("cmeid").str else ""
                WSAEnlilEvent(simID, modelTime, estArrival, isEarthGB, rmin, kp90, kp135, kp180, cmeid, lat, lon, spd, ha)
            }.toList
        }
    }.toList
    println(s"WSA-Enlil events processed: ${events.size}")
    events
}


// ============================================================
// 6. CME ANALYSIS
// ============================================================

def analyzeCME(
    events: List[CMEEvent]
): Unit = {

    println()
    println("========================================")
    println("              CME ANALYSIS")
    println("========================================")


    if (events.isEmpty) {

        println("No CME data available.")

        return
    }


    val averageSpeed =
        events
            .map(_.speed)
            .sum
            .toDouble / events.size


    val fastest =
        events.maxBy(_.speed)


    val slowest =
        events.minBy(_.speed)


    val typeDistribution =
        events
            .groupBy(_.cmeType)
            .view
            .mapValues(_.size)
            .toMap


    println(
        s"Total CME Events : ${events.size}"
    )


    println(
        f"Average Speed    : $averageSpeed%.2f km/s"
    )


    println(
        s"Fastest CME      : ${fastest.speed} km/s"
    )


    println(
        s"Fastest CME ID   : ${fastest.activityID}"
    )


    println(
        s"Slowest CME      : ${slowest.speed} km/s"
    )


    println()
    println("CME Type Distribution")
    println("----------------------------------------")


    for (
        (cmeType, count) <-
            typeDistribution
                .toSeq
                .sortBy(_._1)
    ) {

        println(
            s"Type $cmeType : $count"
        )
    }
}


// ============================================================
// 7. SOLAR FLARE ANALYSIS
// ============================================================

def analyzeFlares(
    events: List[SolarFlareEvent]
): Unit = {

    println()
    println("========================================")
    println("         SOLAR FLARE ANALYSIS")
    println("========================================")


    if (events.isEmpty) {

        println("No Solar Flare data available.")

        return
    }


    val classDistribution =
        events
            .groupBy { flare =>

                if (
                    flare.classType == "Unknown" ||
                    flare.classType.isEmpty
                ) {

                    "Unknown"

                } else {

                    flare.classType
                        .charAt(0)
                        .toUpper
                        .toString
                }
            }
            .view
            .mapValues(_.size)
            .toMap


    println(
        s"Total Solar Flares : ${events.size}"
    )


    println()
    println("Flare Class Distribution")
    println("----------------------------------------")


    for (
        (flareClass, count) <-
            classDistribution
                .toSeq
                .sortBy(_._1)
    ) {

        if (flareClass == "Unknown") {

            println(
                s"Unknown : $count"
            )

        } else {

            println(
                s"$flareClass-Class : $count"
            )
        }
    }


    // Find strongest flare by GOES class

    val classRank =
        Map(
            "A" -> 1,
            "B" -> 2,
            "C" -> 3,
            "M" -> 4,
            "X" -> 5
        )


    def flareStrength(
        classType: String
    ): (Int, Double) = {

        if (
            classType == "Unknown" ||
            classType.isEmpty
        ) {

            (0, 0.0)

        } else {

            val letter =
                classType
                    .take(1)
                    .toUpperCase


            val magnitude =
                classType
                    .drop(1)
                    .toDoubleOption
                    .getOrElse(0.0)


            (
                classRank.getOrElse(
                    letter,
                    0
                ),
                magnitude
            )
        }
    }


    val validFlares =
        events.filter { flare =>

            flareStrength(
                flare.classType
            )._1 > 0
        }


    if (validFlares.nonEmpty) {

        val strongestFlare =
            validFlares.maxBy { flare =>

                flareStrength(
                    flare.classType
                )
            }


        println()

        println(
            s"Strongest Flare    : ${strongestFlare.classType}"
        )

        println(
            s"Strongest Flare ID : ${strongestFlare.flareID}"
        )
    }
}


// ============================================================
// 8. GEOMAGNETIC STORM ANALYSIS
// ============================================================

def analyzeStorms(
    events: List[GeomagneticStorm]
): Unit = {

    println()
    println("========================================")
    println("      GEOMAGNETIC STORM ANALYSIS")
    println("========================================")


    if (events.isEmpty) {

        println(
            "No Geomagnetic Storm data available."
        )

        return
    }


    val strongestStorm =
        events.maxBy(
            _.maxKpIndex
        )


    val averageKp =
        events
            .map(_.maxKpIndex)
            .sum / events.size


    println(
        s"Total Storms       : ${events.size}"
    )


    println(
        f"Average Maximum Kp : $averageKp%.2f"
    )


    println(
        s"Highest Kp Index   : ${strongestStorm.maxKpIndex}"
    )


    println(
        s"Strongest Storm ID : ${strongestStorm.stormID}"
    )
}


// ============================================================
// CREATE DATABASE TABLES
// ============================================================

def createTables(connection: Connection): Unit = {

    val statement = connection.createStatement()

    // --------------------------------------------------------
    // CME TABLE
    // --------------------------------------------------------

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS cme_events (
            activity_id TEXT PRIMARY KEY,
            start_time TEXT,
            source_location TEXT,
            speed INTEGER,
            half_angle INTEGER,
            cme_type TEXT,
            latitude REAL,
            longitude REAL,
            linked_events TEXT,
            enlil_arrival TEXT,
            is_earth_gb INTEGER
        )
        """
    )


    // --------------------------------------------------------
    // SOLAR FLARE TABLE
    // --------------------------------------------------------

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS solar_flare_events (
            flare_id TEXT PRIMARY KEY,
            begin_time TEXT,
            peak_time TEXT,
            class_type TEXT,
            source_location TEXT
        )
        """
    )


    // --------------------------------------------------------
    // GEOMAGNETIC STORM TABLE
    // --------------------------------------------------------

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS geomagnetic_storm_events (
            storm_id TEXT PRIMARY KEY,
            start_time TEXT,
            max_kp_index REAL
        )
        """
    )

    // --------------------------------------------------------
    // SEP TABLE
    // --------------------------------------------------------

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS sep_events (
            sep_id TEXT PRIMARY KEY,
            event_time TEXT,
            instrument TEXT,
            linked_cme TEXT
        )
        """
    )

    // --------------------------------------------------------
    // IPS TABLE
    // --------------------------------------------------------

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS ips_events (
            ips_id TEXT PRIMARY KEY,
            event_time TEXT,
            location TEXT,
            catalog TEXT,
            instrument TEXT,
            linked_events TEXT
        )
        """
    )

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS mpc_events (
            mpc_id TEXT PRIMARY KEY,
            event_time TEXT,
            instrument TEXT,
            linked_events TEXT,
            link TEXT
        )
        """
    )

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS rbe_events (
            rbe_id TEXT PRIMARY KEY,
            event_time TEXT,
            instrument TEXT,
            linked_events TEXT,
            link TEXT
        )
        """
    )

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS hss_events (
            hss_id TEXT PRIMARY KEY,
            event_time TEXT,
            instrument TEXT,
            linked_events TEXT,
            link TEXT
        )
        """
    )

    statement.execute(
        """
        CREATE TABLE IF NOT EXISTS wsa_enlil_events (
            simulation_id TEXT PRIMARY KEY,
            model_completion_time TEXT,
            estimated_shock_arrival TEXT,
            is_earth_gb INTEGER,
            rmin_re TEXT,
            kp90 INTEGER,
            kp135 INTEGER,
            kp180 INTEGER,
            cme_id TEXT,
            latitude REAL,
            longitude REAL,
            speed INTEGER,
            half_angle INTEGER,
            link TEXT
        )
        """
    )


    statement.close()
}


// ============================================================
// 10. SAVE CME EVENTS
// ============================================================

def saveCMEs(
    connection: Connection,
    events: List[CMEEvent]
): Int = {

    val sql =
        """
        INSERT OR IGNORE INTO cme_events
        (
            activity_id,
            start_time,
            source_location,
            speed,
            half_angle,
            cme_type,
            latitude,
            longitude,
            linked_events,
            enlil_arrival,
            is_earth_gb
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """


    val statement =
        connection.prepareStatement(sql)


    var inserted = 0


    for (event <- events) {

        statement.setString(
            1,
            event.activityID
        )

        statement.setString(
            2,
            event.startTime
        )

        statement.setString(
            3,
            event.sourceLocation
        )

        statement.setInt(
            4,
            event.speed
        )

        statement.setInt(
            5,
            event.halfAngle
        )

        statement.setString(
            6,
            event.cmeType
        )

        statement.setDouble(7, event.latitude)
        statement.setDouble(8, event.longitude)
        statement.setString(9, event.linkedEvents)
        statement.setString(10, event.enlilArrival)
        statement.setInt(11, if (event.isEarthGB) 1 else 0)


        inserted +=
            statement.executeUpdate()
    }


    statement.close()

    inserted
}


// ============================================================
// 11. SAVE SOLAR FLARE EVENTS
// ============================================================

def saveFlares(
    connection: Connection,
    events: List[SolarFlareEvent]
): Int = {

    val sql =
        """
        INSERT OR IGNORE INTO solar_flare_events
        (
            flare_id,
            begin_time,
            peak_time,
            class_type,
            source_location
        )
        VALUES (?, ?, ?, ?, ?)
        """


    val statement =
        connection.prepareStatement(sql)


    var inserted = 0


    for (event <- events) {

        statement.setString(
            1,
            event.flareID
        )

        statement.setString(
            2,
            event.beginTime
        )

        statement.setString(
            3,
            event.peakTime
        )

        statement.setString(
            4,
            event.classType
        )

        statement.setString(
            5,
            event.sourceLocation
        )


        inserted +=
            statement.executeUpdate()
    }


    statement.close()

    inserted
}


// ============================================================
// 12. SAVE GEOMAGNETIC STORMS
// ============================================================

def saveStorms(
    connection: Connection,
    events: List[GeomagneticStorm]
): Int = {

    val sql =
        """
        INSERT OR IGNORE INTO geomagnetic_storm_events
        (
            storm_id,
            start_time,
            max_kp_index
        )
        VALUES (?, ?, ?)
        """


    val statement =
        connection.prepareStatement(sql)


    var inserted = 0


    for (event <- events) {

        statement.setString(
            1,
            event.stormID
        )

        statement.setString(
            2,
            event.startTime
        )

        statement.setDouble(
            3,
            event.maxKpIndex
        )


        inserted +=
            statement.executeUpdate()
    }


    statement.close()

    inserted
}


// ============================================================
// 12B. SAVE SEP EVENTS
// ============================================================

def saveSEPs(
    connection: Connection,
    events: List[SEPEvent]
): Int = {

    val sql =
        """
        INSERT OR IGNORE INTO sep_events
        (
            sep_id,
            event_time,
            instrument,
            linked_cme
        )
        VALUES (?, ?, ?, ?)
        """

    val statement =
        connection.prepareStatement(sql)

    var inserted = 0

    for (event <- events) {

        statement.setString(1, event.sepID)
        statement.setString(2, event.eventTime)
        statement.setString(3, event.instrument)
        statement.setString(4, event.linkedCME)

        inserted += statement.executeUpdate()
    }

    statement.close()
    inserted
}


// ============================================================
// 12C. SAVE IPS EVENTS
// ============================================================

def saveIPSs(
    connection: Connection,
    events: List[IPSEvent]
): Int = {

    val sql =
        """
        INSERT OR IGNORE INTO ips_events
        (
            ips_id,
            event_time,
            location,
            catalog,
            instrument,
            linked_events
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """

    val statement =
        connection.prepareStatement(sql)

    var inserted = 0

    for (event <- events) {

        statement.setString(1, event.ipsID)
        statement.setString(2, event.eventTime)
        statement.setString(3, event.location)
        statement.setString(4, event.catalog)
        statement.setString(5, event.instrument)
        statement.setString(6, event.linkedEvents)

        inserted += statement.executeUpdate()
    }

    statement.close()
    inserted
}

def saveMPCs(
    connection: Connection,
    events: List[MPCEvent]
): Int = {
    val sql = """
        INSERT OR IGNORE INTO mpc_events
        (mpc_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
        """
    val statement = connection.prepareStatement(sql)
    var inserted = 0
    for (event <- events) {
        statement.setString(1, event.mpcID)
        statement.setString(2, event.eventTime)
        statement.setString(3, event.instrument)
        statement.setString(4, event.linkedEvents)
        statement.setString(5, "")
        inserted += statement.executeUpdate()
    }
    statement.close()
    inserted
}

def saveRBEs(
    connection: Connection,
    events: List[RBEEvent]
): Int = {
    val sql = """
        INSERT OR IGNORE INTO rbe_events
        (rbe_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
        """
    val statement = connection.prepareStatement(sql)
    var inserted = 0
    for (event <- events) {
        statement.setString(1, event.rbeID)
        statement.setString(2, event.eventTime)
        statement.setString(3, event.instrument)
        statement.setString(4, event.linkedEvents)
        statement.setString(5, "")
        inserted += statement.executeUpdate()
    }
    statement.close()
    inserted
}

def saveHSSs(
    connection: Connection,
    events: List[HSSEvent]
): Int = {
    val sql = """
        INSERT OR IGNORE INTO hss_events
        (hss_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
        """
    val statement = connection.prepareStatement(sql)
    var inserted = 0
    for (event <- events) {
        statement.setString(1, event.hssID)
        statement.setString(2, event.eventTime)
        statement.setString(3, event.instrument)
        statement.setString(4, event.linkedEvents)
        statement.setString(5, "")
        inserted += statement.executeUpdate()
    }
    statement.close()
    inserted
}

def saveWSAEnlils(
    connection: Connection,
    events: List[WSAEnlilEvent]
): Int = {
    val sql = """
        INSERT OR IGNORE INTO wsa_enlil_events
        (simulation_id, model_completion_time, estimated_shock_arrival, is_earth_gb, rmin_re, kp90, kp135, kp180, cme_id, latitude, longitude, speed, half_angle, link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
    val statement = connection.prepareStatement(sql)
    var inserted = 0
    var seen = Set[String]()
    for (event <- events) {
        val key = if (event.cmeID.nonEmpty) s"${event.simulationID}::${event.cmeID}" else event.simulationID
        if (!seen.contains(key)) {
            seen += key
            statement.setString(1, key)
            statement.setString(2, event.modelCompletionTime)
            statement.setString(3, event.estimatedShockArrivalTime)
            statement.setInt(4, if (event.isEarthGB) 1 else 0)
            statement.setString(5, event.rmin_re)
            statement.setInt(6, event.kp90)
            statement.setInt(7, event.kp135)
            statement.setInt(8, event.kp180)
            statement.setString(9, event.cmeID)
            statement.setDouble(10, event.latitude)
            statement.setDouble(11, event.longitude)
            statement.setInt(12, event.speed)
            statement.setInt(13, event.halfAngle)
            statement.setString(14, "")
            inserted += statement.executeUpdate()
        }
    }
    statement.close()
    inserted
}


// ============================================================
// 13. GET DATABASE RECORD COUNT
// ============================================================

def getCount(
    connection: Connection,
    tableName: String
): Int = {

    val allowedTables = Set(
        "cme_events",
        "solar_flare_events",
        "geomagnetic_storm_events",
        "sep_events",
        "ips_events",
        "mpc_events",
        "rbe_events",
        "hss_events",
        "wsa_enlil_events"
    )

    if (!allowedTables.contains(tableName)) {
        return 0
    }

    val statement =
        connection.createStatement()


    val result =
        statement.executeQuery(
            s"SELECT COUNT(*) FROM $tableName"
        )


    val count =
        if (result.next())
            result.getInt(1)
        else
            0


    result.close()

    statement.close()


    count
}


// ============================================================
// 14. DATE VALIDATION
// ============================================================

def validateDates(
    startDate: String,
    endDate: String
): Boolean = {

    try {

        val start =
            LocalDate.parse(startDate)

        val end =
            LocalDate.parse(endDate)


        if (start.isAfter(end)) {

            println()
            println(
                "ERROR: Start date cannot be after end date."
            )

            false

        } else {

            true
        }

    } catch {

        case _: DateTimeParseException =>

            println()
            println(
                "ERROR: Invalid date format."
            )

            println(
                "Please use YYYY-MM-DD."
            )

            println(
                "Example: 2026-08-01"
            )

            false
    }
}


// ============================================================
// 15. MAIN PROGRAM
// ============================================================

@main
def spaceGuard(
    startDate: String,
    endDate: String
): Unit = {

    println("========================================")
    println("               SPACEGUARD")
    println("       SPACE WEATHER MONITORING")
    println("========================================")

    println(
        s"Start Date : $startDate"
    )

    println(
        s"End Date   : $endDate"
    )

    println()


    // ========================================================
    // CHECK DATES
    // ========================================================

    if (
        !validateDates(
            startDate,
            endDate
        )
    ) {

        return
    }


    var connection: Connection = null


    try {

        // ====================================================
        // FETCH NASA DATA
        // ====================================================

        println(
            "Fetching NASA DONKI data (parallel)..."
        )

        println()


        val fetched =
            Await.result(
                for {
                    cmeEvents <-
                        Future(
                            fetchCME(
                                startDate,
                                endDate
                            )
                        )

                    flareEvents <-
                        Future(
                            fetchSolarFlares(
                                startDate,
                                endDate
                            )
                        )

                    stormEvents <-
                        Future(
                            fetchStorms(
                                startDate,
                                endDate
                            )
                        )

                    sepEvents <-
                        Future(
                            fetchSEP(
                                startDate,
                                endDate
                            )
                        )

                    ipsEvents <-
                        Future(
                            fetchIPS(
                                startDate,
                                endDate
                            )
                        )

                    mpcEvents <-
                        Future(
                            fetchMPC(
                                startDate,
                                endDate
                            )
                        )

                    rbeEvents <-
                        Future(
                            fetchRBE(
                                startDate,
                                endDate
                            )
                        )

                    hssEvents <-
                        Future(
                            fetchHSS(
                                startDate,
                                endDate
                            )
                        )

                    wsaEvents <-
                        Future(
                            fetchWSAEnlil(
                                startDate,
                                endDate
                            )
                        )
                } yield (
                    cmeEvents,
                    flareEvents,
                    stormEvents,
                    sepEvents,
                    ipsEvents,
                    mpcEvents,
                    rbeEvents,
                    hssEvents,
                    wsaEvents
                ),
                120.seconds
            )

        val cmeEvents = fetched._1
        val flareEvents = fetched._2
        val stormEvents = fetched._3
        val sepEvents = fetched._4
        val ipsEvents = fetched._5
        val mpcEvents = fetched._6
        val rbeEvents = fetched._7
        val hssEvents = fetched._8
        val wsaEvents = fetched._9


        // ====================================================
        // ANALYZE DATA
        // ====================================================

        analyzeCME(
            cmeEvents
        )


        analyzeFlares(
            flareEvents
        )


        analyzeStorms(
            stormEvents
        )

        println()
        println("========================================")
        println("              SEP ANALYSIS")
        println("========================================")
        println(s"Total SEP Events       : ${sepEvents.size}")
        println()

        println("========================================")
        println("              IPS ANALYSIS")
        println("========================================")
        println(s"Total IPS Events       : ${ipsEvents.size}")
        println()

        println("========================================")
        println("              MPC ANALYSIS")
        println("========================================")
        println(s"Total MPC Events       : ${mpcEvents.size}")
        println(s"Linked CMEs            : ${mpcEvents.count(_.linkedEvents.nonEmpty)}")
        println()

        println("========================================")
        println("              RBE ANALYSIS")
        println("========================================")
        println(s"Total RBE Events       : ${rbeEvents.size}")
        println(s"Avg per week (proxy)   : ${if (rbeEvents.nonEmpty) f"${rbeEvents.size / 4.0}%.1f" else "0"}")
        println()

        println("========================================")
        println("              HSS ANALYSIS")
        println("========================================")
        println(s"Total HSS Events       : ${hssEvents.size}")
        println()

        println("========================================")
        println("           WSA-ENLIL ANALYSIS")
        println("========================================")
        println(s"Total WSA-ENLIL inputs : ${wsaEvents.size}")
        println(s"Earth-directed (GB)    : ${wsaEvents.count(_.isEarthGB)}")
        println(s"Max speed input        : ${if (wsaEvents.nonEmpty) wsaEvents.map(_.speed).max else 0} km/s")
        println()


        // ====================================================
        // CONNECT TO SQLITE
        // ====================================================

        println()
        println("========================================")
        println("              DATABASE")
        println("========================================")

        println(
            "Connecting to SQLite..."
        )


        connection =
            DriverManager.getConnection(
                "jdbc:sqlite:database/spaceguard.db"
            )

        connection.setAutoCommit(false)


        // ====================================================
        // CREATE TABLES
        // ====================================================

        createTables(
            connection
        )


        // ====================================================
        // SAVE DATA
        // ====================================================

        val newCMEs =
            saveCMEs(
                connection,
                cmeEvents
            )


        val newFlares =
            saveFlares(
                connection,
                flareEvents
            )


        val newStorms =
            saveStorms(
                connection,
                stormEvents
            )

        val newSEPs =
            saveSEPs(
                connection,
                sepEvents
            )

        val newIPSs =
            saveIPSs(
                connection,
                ipsEvents
            )

        val newMPCs =
            saveMPCs(
                connection,
                mpcEvents
            )

        val newRBEs =
            saveRBEs(
                connection,
                rbeEvents
            )

        val newHSSs =
            saveHSSs(
                connection,
                hssEvents
            )

        val newWSAs =
            saveWSAEnlils(
                connection,
                wsaEvents
            )

        connection.commit()


        // ====================================================
        // DATABASE COUNTS
        // ====================================================

        val totalCMEs =
            getCount(
                connection,
                "cme_events"
            )


        val totalFlares =
            getCount(
                connection,
                "solar_flare_events"
            )


        val totalStorms =
            getCount(
                connection,
                "geomagnetic_storm_events"
            )

        val totalSEPs =
            getCount(
                connection,
                "sep_events"
            )

        val totalIPSs =
            getCount(
                connection,
                "ips_events"
            )

        val totalMPCs =
            getCount(
                connection,
                "mpc_events"
            )

        val totalRBEs =
            getCount(
                connection,
                "rbe_events"
            )

        val totalHSSs =
            getCount(
                connection,
                "hss_events"
            )

        val totalWSAs =
            getCount(
                connection,
                "wsa_enlil_events"
            )


        // ====================================================
        // DATABASE SUMMARY
        // ====================================================

        println()
        println("========================================")
        println("          DATABASE SUMMARY")
        println("========================================")


        println(
            s"New CME Events Inserted         : $newCMEs"
        )


        println(
            s"New Solar Flares Inserted       : $newFlares"
        )


        println(
            s"New Geomagnetic Storms Inserted : $newStorms"
        )

        println(
            s"New SEP Events Inserted         : $newSEPs"
        )

        println(
            s"New IPS Events Inserted         : $newIPSs"
        )

        println(
            s"New MPC Events Inserted         : $newMPCs"
        )

        println(
            s"New RBE Events Inserted         : $newRBEs"
        )

        println(
            s"New HSS Events Inserted         : $newHSSs"
        )

        println(
            s"New WSA-Enlil Inputs Inserted   : $newWSAs"
        )


        println()


        println(
            s"Total CME Events                : $totalCMEs"
        )


        println(
            s"Total Solar Flares              : $totalFlares"
        )


        println(
            s"Total Geomagnetic Storms        : $totalStorms"
        )

        println(
            s"Total SEP Events                : $totalSEPs"
        )

        println(
            s"Total IPS Events                : $totalIPSs"
        )

        println(
            s"Total MPC Events                : $totalMPCs"
        )

        println(
            s"Total RBE Events                : $totalRBEs"
        )

        println(
            s"Total HSS Events                : $totalHSSs"
        )

        println(
            s"Total WSA-Enlil Inputs          : $totalWSAs"
        )


        println(
            "========================================"
        )


        // ====================================================
        // CLOSE DATABASE
        // ====================================================

        connection.close()


        println()
        println(
            "SpaceGuard completed successfully."
        )


    } catch {

        case e: Exception =>

            if (connection != null) {

                try connection.rollback()
                catch { case _: Exception => }

                try connection.close()
                catch { case _: Exception => }
            }

            println()
            println("SPACEGUARD ERROR")
            println("----------------------------------------")

            println(
                e.getMessage
            )

            e.printStackTrace()

            sys.exit(1)
    }
}