import { Request, Response } from 'express'
import pool from '../config/db'

// 创建客服订单
export const createCustomerOrder = async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      date,
      is_fixed,
      order_content,
      word_count,
      fee,
      writer_id,
      exchange_time,
      payment_channel,
      store_name,
      new_customer,
      customer_name,
      order_amount,
      refund_amount,
      special_situation,
      dispatch_id
    } = req.body;
    
    const userId = (req as any).userId;

    // 检查当前用户是否是客服角色
    const [userRole]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    // 只允许客服角色创建订单
    if (userRole.length === 0 || !userRole[0].role_name.includes('客服')) {
      return res.status(403).json({
        code: 1,
        message: '非客服角色无权创建订单'
      });
    }

    // 检查订单号是否已存在
    const [existingOrder]: any = await pool.query(
      'SELECT order_id FROM customer_orders WHERE order_id = ?',
      [order_id]
    );

    if (existingOrder.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '订单号已存在'
      });
    }

    // 检查派单编号唯一性（如果有填写）
    if (dispatch_id) {
      const [existingDispatch]: any = await pool.query(
        'SELECT id FROM customer_orders WHERE dispatch_id = ?',
        [dispatch_id]
      );
      if (existingDispatch.length > 0) {
        return res.status(400).json({
          code: 1,
          message: '派单编号已存在'
        });
      }
    }

    // 检查写手是否存在（如果有填写）
    if (writer_id) {
      let writerIdToUse = writer_id;
      console.log('前端传入writer_id:', writer_id);
      // 如果传的是纯数字，自动查业务编号
      if (/^\d+$/.test(writer_id)) {
        const [writer]: any = await pool.query(
          'SELECT writer_id FROM writer_info WHERE id = ?',
          [writer_id]
        );
        if (writer.length > 0) {
          writerIdToUse = writer[0].writer_id;
        }
      }
      console.log('最终用于校验的writerIdToUse:', writerIdToUse);
      // 校验业务编号是否存在
      const [writerCheck]: any = await pool.query(
        'SELECT writer_id FROM writer_info WHERE writer_id = ?',
        [writerIdToUse]
      );
      console.log('writerCheck结果:', writerCheck);
      if (!writerCheck || writerCheck.length === 0) {
        return res.status(400).json({
          code: 1,
          message: '指定的写手不存在'
        });
      }
      // 用业务编号替换
      req.body.writer_id = writerIdToUse;
    }

    // 创建订单，自动设置客服ID为当前用户ID
    const [result]: any = await pool.query(
      'INSERT INTO customer_orders SET ?',
      {
        order_id,
        date,
        is_fixed,
        order_content,
        word_count,
        fee,
        customer_id: userId, // 强制设置为当前登录的客服ID
        writer_id: req.body.writer_id || null, // 这里writer_id必须是业务编号
        exchange_time,
        payment_channel,
        store_name,
        new_customer,
        customer_name,
        order_amount,
        refund_amount,
        special_situation,
        dispatch_id: dispatch_id || null
      }
    );

    // 查找系统订单表中是否存在匹配的订单
    const [systemOrder]: any = await pool.query(
      'SELECT order_id FROM orders WHERE order_id = ?',
      [order_id]
    );

    // 如果在系统订单表中找到匹配的订单，则更新该订单的客服和写手信息
    if (systemOrder.length > 0) {
      // 只同步 customer_id，writer_id 有值才同步
      if (req.body.writer_id) {
        await pool.query(
          'UPDATE orders SET customer_id = ?, writer_id = ? WHERE order_id = ?',
          [userId, req.body.writer_id, order_id]
        );
      } else {
        await pool.query(
          'UPDATE orders SET customer_id = ? WHERE order_id = ?',
          [userId, order_id]
        );
      }
    }

    res.json({
      code: 0,
      message: '创建成功',
      data: {
        id: result.insertId,
        order_id
      }
    });
  } catch (err: any) {
    console.error('Create customer order error:', err);
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    });
  }
}

// 获取客服订单列表
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      order_id,
      date_start,
      date_end,
      customer_id,
      writer_id,
      is_fixed
    } = req.query;

    const userId = (req as any).userId;

    // 获取当前用户角色信息
    const [userRole]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );
    const roleName = userRole[0]?.role_name || '';

    // 写手角色处理
    let myWriterId: string | null = null;
    if (roleName === '写手') {
      // 直接用username作为writer_id
      const [userInfo]: any = await pool.query(
        'SELECT username FROM users WHERE id = ?',
        [userId]
      );
      if (!userInfo.length || !userInfo[0].username) {
        return res.json({ code: 0, data: { total: 0, list: [] }, message: "获取成功" });
      }
      myWriterId = userInfo[0].username;
    }

    // 判断用户是否是客服角色
    const isCustomerService = roleName.includes('客服');

    // 构建查询条件
    let sql = `
      SELECT co.*, 
             u.username as customer_service_name, 
             w.name as writer_name, 
             w.writer_id as writer_biz_id
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      LEFT JOIN writer_info w ON co.writer_id = w.writer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 如果是写手角色，只能查自己相关订单
    if (roleName === '写手') {
      sql += ' AND co.writer_id = ?';
      params.push(myWriterId);
    } else if (isCustomerService) {
      // 如果是客服角色，只查询自己的订单
      sql += ' AND co.customer_id = ?';
      params.push(userId);
    }

    // 其他查询条件
    if (order_id) {
      sql += ' AND co.order_id = ?';
      params.push(order_id);
    }
    if (date_start) {
      sql += ' AND co.date >= ?';
      params.push(date_start);
    }
    if (date_end) {
      sql += ' AND co.date <= ?';
      params.push(date_end);
    }
    if (customer_id && !isCustomerService) { // 如果是客服角色，忽略customer_id参数
      sql += ' AND co.customer_id = ?';
      params.push(customer_id);
    }
    if (writer_id) {
      sql += ' AND co.writer_id = ?';
      params.push(writer_id);
    }
    if (is_fixed !== undefined) {
      sql += ' AND co.is_fixed = ?';
      params.push(is_fixed);
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    );
    const total = countResult[0].total;

    // 分页查询
    sql += ' ORDER BY co.date DESC, co.id DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const [rows] = await pool.query(sql, params);

    // 替换writer_id为业务编号
    let resultRows = Array.isArray(rows)
      ? rows.map((row: any) => {
          const { writer_biz_id, ...rest } = row;
          let result = {
            ...rest,
            writer_id: writer_biz_id || null
          };
          // 写手角色过滤部分字段
          if (roleName === '写手') {
            delete result.order_id;
            delete result.payment_channel;
            delete result.store_name;
            delete result.customer_name;
          }
          return result;
        })
      : [];
    res.json({
      code: 0,
      data: {
        total,
        list: resultRows
      },
      message: "获取成功"
    });
  } catch (err: any) {
    console.error('Get customer orders error:', err);
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    });
  }
}

// 通过ID查询客户订单
export const getCustomerOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [ordersResult]: any = await pool.query(
      `SELECT co.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_service_name,
        w.name as writer_name,
        w.writer_id as writer_biz_id
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      LEFT JOIN writer_info w ON co.writer_id = w.writer_id
      WHERE co.id = ?`,
      [id]
    )

    const orders = Array.isArray(ordersResult) ? ordersResult : []

    if (orders.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '订单不存在'
      })
    }

    // 替换writer_id为业务编号
    const { writer_biz_id, ...rest } = orders[0];
    const order = { ...rest, writer_id: writer_biz_id || null };
    res.json({
      code: 0,
      data: order
    })
  } catch (error) {
    console.error('Get customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新客服订单
export const updateCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData: Record<string, any> = req.body

    // 检查数据中是否有order_id，如果有，验证是否已存在
    if (updateData.order_id) {
      const [existingOrder]: any = await pool.query(
        'SELECT id FROM customer_orders WHERE order_id = ? AND id != ?',
        [updateData.order_id, id]
      )

      if (existingOrder && existingOrder.length > 0) {
        return res.status(400).json({
          code: 1,
          message: '订单号已存在'
        })
      }
    }

    // 检查派单编号唯一性（如果有填写）
    if (updateData.dispatch_id) {
      const [existingDispatch]: any = await pool.query(
        'SELECT id FROM customer_orders WHERE dispatch_id = ? AND id != ?',
        [updateData.dispatch_id, id]
      )
      if (existingDispatch && existingDispatch.length > 0) {
        return res.status(400).json({
          code: 1,
          message: '派单编号已存在'
        })
      }
    }

    // 检查写手是否存在（如果有填写）
    if (updateData.writer_id) {
      // 如果传的是纯数字，自动查业务编号
      if (/^\d+$/.test(updateData.writer_id)) {
        const [writer]: any = await pool.query(
          'SELECT writer_id FROM writer_info WHERE id = ?',
          [updateData.writer_id]
        );
        if (writer.length > 0) {
          updateData.writer_id = writer[0].writer_id;
        }
      }
      // 校验业务编号是否存在
      const [writerCheck]: any = await pool.query(
        'SELECT writer_id FROM writer_info WHERE writer_id = ?',
        [updateData.writer_id]
      );
      if (!writerCheck || writerCheck.length === 0) {
        return res.status(400).json({
          code: 1,
          message: '指定的写手不存在'
        })
      }
    }

    // 更新订单
    await pool.query(
      'UPDATE customer_orders SET ? WHERE id = ?',
      [updateData, id]
    )

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除客服订单
export const deleteCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 删除订单
    await pool.query(
      'DELETE FROM customer_orders WHERE id = ?',
      [id]
    )

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 手动合并客服订单到订单总表
export const mergeCustomerOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // 检查当前用户是否有权限操作（必须是客服、超管或财务）
    const [currentUser]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    )

    if (currentUser.length === 0 || 
        !(currentUser[0].role_name.includes('客服') || 
          currentUser[0].role_name.includes('超级管理员') || 
          currentUser[0].role_name.includes('财务'))) {
      return res.status(403).json({
        code: 1,
        message: '您没有权限执行此操作'
      })
    }

    // 查找所有符合条件的订单进行合并
    // 条件：客服订单表中有记录，且订单总表中也有相同订单号的记录
    const [orderPairs]: any = await pool.query(
      `SELECT co.order_id, co.customer_id, co.writer_id, w.writer_id as writer_biz_id
       FROM customer_orders co
       INNER JOIN orders o ON co.order_id = o.order_id
       LEFT JOIN writer_info w ON co.writer_id = w.writer_id
       WHERE (o.customer_id IS NULL OR o.writer_id IS NULL)` // 订单总表中客服ID或写手ID至少有一个为空
    )

    if (orderPairs.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '没有符合条件的订单需要合并'
      })
    }

    // 批量更新所有需要合并的订单
    const mergedOrders = []
    for (const order of orderPairs) {
      // customer_id 一定同步，writer_id 有值才同步
      if (order.writer_id) {
        await pool.query(
          'UPDATE orders SET customer_id = ?, writer_id = ? WHERE order_id = ?',
          [order.customer_id, order.writer_id, order.order_id]
        )
      } else {
        await pool.query(
          'UPDATE orders SET customer_id = ? WHERE order_id = ?',
          [order.customer_id, order.order_id]
        )
      }
      mergedOrders.push({
        order_id: order.order_id,
        customer_id: order.customer_id,
        writer_id: order.writer_biz_id || null
      })
    }

    res.json({
      code: 0,
      message: '合并成功',
      data: {
        total: mergedOrders.length,
        merged_orders: mergedOrders
      }
    })
  } catch (error) {
    console.error('Merge customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 