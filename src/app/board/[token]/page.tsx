import { notFound } from "next/navigation"
import { getBoardConfig, getBoardData } from "@/features/boards/queries"
import { BoardClient } from "./board-client"

export const revalidate = 1800

export default async function BoardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const config = await getBoardConfig(token)
  if (!config) notFound()

  const data = await getBoardData(config.propertyId)

  return <BoardClient config={config} data={data} />
}
