export type BusRoute = {
  id: string;
  busNumber: string;
  description: string;
  stops: string[];
};

export const busRoutes: BusRoute[] = [
  {
    id: "1",
    busNumber: "15",
    description: "Statebank to KPT",
    stops: ["Statebank", "Hampankatta", "PVS", "MG Road", "KPT"],
  },
  {
    id: "2",
    busNumber: "45G",
    description: "Statebank to Surathkal",
    stops: ["Statebank", "Lalbagh", "Bejai", "Kottara Chowki", "Kulur", "Surathkal"],
  },
  {
    id: "3",
    busNumber: "2C",
    description: "Kavoor to Statebank",
    stops: ["Kavoor", "Bondel", "Yeyyadi", "Kuntikan", "Statebank"],
  },
  {
    id: "4",
    busNumber: "19",
    description: "Statebank to Mangaladevi",
    stops: ["Statebank", "Clock Tower", "Falnir", "Kankanady", "Mangaladevi"],
  },
  {
    id: "5",
    busNumber: "52",
    description: "Mangalore University to Statebank",
    stops: ["Mangalore University", "Konaje", "Thokottu", "Pumpwell", "Statebank"],
  },
  {
    id: "6",
    busNumber: "33",
    description: "Statebank to Bajpe Airport",
    stops: ["Statebank", "Kavoor", "Maravoor", "Kenjar", "Bajpe Airport"],
  },
  {
    id: "7",
    busNumber: "27",
    description: "Statebank to Cascia",
    stops: ["Statebank", "Hampankatta", "Jyothi", "Balmatta", "Cascia"],
  },
  {
    id: "8",
    busNumber: "6B",
    description: "Shaktinagar to Statebank",
    stops: ["Shaktinagar", "Nanthoor", "Bikarnakatte", "Kankanady", "Statebank"],
  }
];
