import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Row, Container } from "react-bootstrap";

type sensorDataT = {
  value: number;
};

type chartDataT = {
  id: string;
  sensorData: number;
};

type messageDataT = {
  date: string;
  sensorData: sensorDataT;
};

export const SensorChart = () => {
  const ws = useRef<WebSocket>();
  const [data, setData] = useState<chartDataT[]>([]);

  useEffect(() => {
    console.log("render chart");
    //Send request to our websocket server using the "/request" path
    ws.current = new WebSocket("ws://10.0.0.88:8000/ws");

    ws.current.onmessage = (e: MessageEvent) => {
      console.log("message event", e.data);
      let weight: string | number = e.data;
      weight = (weight as string).replace("lb", "").trim();
      weight = Math.round(parseFloat(weight));

      if (weight > 0) {
        const message: messageDataT = {
          date: Date.now().toString(),
          sensorData: { value: weight },
        };
        console.log(`Received message :: ${message.sensorData.value}`);
        // Upon receiving websocket message then add it to the list of data that we are displaying
        //   let newDataArray = [
        //     ...data,
        //     {
        //       id: message.date,
        //       sensorData: message.sensorData,
        //     },
        //   ];
        //   console.log(newDataArray);
        setData((currentData) => limitData(currentData, message));
      }
    };
    ws.current.onclose = () => {
      console.log("Client socket close!");
    };

    ws.current.onerror = (error) => {
      console.log("Socket Error: ", error);
    };

    //We limit the number of reads to the last 24 reading and drop the last read
    function limitData(currentData: chartDataT[], message: messageDataT) {
      if (currentData.length > 24) {
        console.log("Limit reached, dropping first record!");
        currentData.shift();
      }
      return [
        ...currentData,
        {
          id: message.date,
          sensorData: message.sensorData.value,
        },
      ];
    }

    return () => {
      console.log("Cleaning up! ");
      ws.current?.close();
    };
  }, []);

  //Display the chart using rechart.js
  return (
    <Container className="p-3">
      <Row className="justify-content-md-center">
        <h1 className="header">Real time IOT Sensor Data Using Websockets</h1>
      </Row>
      <Row className="justify-content-md-center">
        <div style={{ width: 1000, height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              width={800}
              height={400}
              data={data}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              {/* <XAxis dataKey="date" /> */}
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sensorData"
                stroke="#8884d8"
                activeDot={{ r: 24 }}
                strokeWidth="4"
              />
              {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Row>
    </Container>
  );
};
