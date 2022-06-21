$(function () {
  ("use strict");
  //This is for the Notification top right
  let oCount = document.getElementById("orderCount").innerHTML;
  let pCount = document.getElementById("processingCount").innerHTML;
  let dCount = document.getElementById("deliveredCount").innerHTML;
  let cCount = document.getElementById("shippedCount").innerHTML;
  // Morris.Area({
  //   element: "morris-area-chart2",
  //   data: [
  //     {
  //       period: "2010",
  //       iMac: 0,
  //       iPhone: 0,
  //     },
  //     {
  //       period: "2011",
  //       iMac: 130,
  //       iPhone: 100,
  //     },
  //     {
  //       period: "2012",
  //       iMac: 30,
  //       iPhone: 60,
  //     },
  //     {
  //       period: "2013",
  //       iMac: 30,
  //       iPhone: 200,
  //     },
  //     {
  //       period: "2014",
  //       iMac: 200,
  //       iPhone: 150,
  //     },
  //     {
  //       period: "2015",
  //       iMac: 105,
  //       iPhone: 90,
  //     },
  //     {
  //       period: "2016",
  //       iMac: 250,
  //       iPhone: 150,
  //     },
  //   ],
  //   xkey: "period",
  //   ykeys: ["iMac", "iPhone"],
  //   labels: ["iMac", "iPhone"],
  //   pointSize: 0,
  //   fillOpacity: 0.4,
  //   pointStrokeColors: ["#b4becb", "#01c0c8"],
  //   behaveLikeLine: true,
  //   gridLineColor: "#e0e0e0",
  //   lineWidth: 0,
  //   smooth: true,
  //   hideHover: "auto",
  //   lineColors: ["#b4becb", "#01c0c8"],
  //   resize: true,
  // });

  // Morris donut chart

  Morris.Donut({
    element: "morris-donut-chart",
    data: [
      {
        label: "Orders",
        value: oCount,
      },
      {
        label: "Processing",
        value: pCount,
      },
      {
        label: "Delivered",
        value: dCount,
      },
      {
        label: "Shipped",
        value: cCount,
      },
    ],
    resize: true,
    colors: ["#fb9678", "#01c0c8", "#4F5467", "#960018"],
  });
});
