from mango_service_v3_py.api import MangoServiceV3Client

if __name__ == "__main__":

    mango_service_v3_client = MangoServiceV3Client()

    print("orders before cancelling")
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))
    print("")

    mango_service_v3_client.cancel_all_orders()
    print("orders after cancelling")
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))
